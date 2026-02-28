#coding: utf-8
import sys
import os.path
from datetime import datetime

# Add the project root directory to sys.path
# __file__ is the path to the current script (web/index.py)
# os.path.dirname(__file__) is the directory of the current script (web/)
# os.path.join(os.path.dirname(__file__), '..') is the parent directory (project root)
# os.path.abspath(...) makes it an absolute path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)


from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from app import utils as Utils
from app import tools as Tools
from web.api import api
import json

app = Flask(__name__)
# register blueprint of API
app.register_blueprint(api, url_prefix='/API')

slides_data = {'pos': [0, 0], 'data': [], 'msg': '', 'dynamic': '', 'key': 0, 'background': [], 'id': 0}
client = {'admin': [], 'lead': [], 'musician': [], 'view': []}
client_mode = ''

# SocketIO section, for presentation control

socketio = SocketIO(app)

@socketio.on('connect')
def handle_connect():
	__update_client(client_mode, request.sid)

@socketio.on('disconnect')
def handle_disconnect():
	# release slides_data if all clients are disconnected
	global client
	print(client)
	sid = request.sid
	for val in client.values():
		if sid in val:
			val.remove(sid)
	if not client['admin'] and not client['musician'] and not client['lead'] and not client['view']:
		_init_slide()
	print('Client disconnected: {}'.format(request.sid))
	print(client)

@socketio.on('reload')
def reload_json():
	print('Reloading json data')
	if __get_slide_json():
		emit('reload', slides_data, broadcast=True)

@socketio.on('control')
def handle_control(data):
	print('Received message:', data)
	if data['type'] == 'pos': # When data is about position change, empty dynamic
		slides_data['dynamic'] = ''
		if slides_data['pos'][0] != data['value'][0]: # When pos is different (new slide), change key to 0
			slides_data['key'] = 0
	slides_data[data['type']] = data['value']
	emit('response', slides_data, broadcast=True)

@socketio.on('msg')
def handle_announcement(data):
	print("msg", data)
	emit('announcement', data, brodcasr=True)

# Rendering interfaces

@app.route("/")
def index():
	id = request.args.get('id', None)
	if id:
		songs = Utils.get_worship_songs(id)
		w = Utils.get_worship(id)
		return render_template('song.html', songs=songs, id=id, w=w)
	sundays = Tools.allsundays()
	worship = Utils.worship_list()
	worship = [{'date': x, 'worship': next((y for y in worship if y['date'] == x), -1)} for x in sundays[1]]
	return render_template('worship.html', worship=worship, sundays=sundays)

@app.route("/info")
def info():
	d = request.args.get('date', '')
	return render_template('info.html', date=d)

@app.route("/worship/<id>")
@app.route("/worship/<id>/<tab>")
def worship_notes(id, tab=''):
	json_file = request.args.get('json', None)
	if json_file:
		json_file = Tools.get_worship_json(id)
		if json_file:
			return render_template('json.html', json=json.dumps(json_file, indent=2, ensure_ascii=False), id=id)
		return "No Slides available", 400

	songs = Utils.get_worship_songs(id)
	w = Utils.worship_list(id)
	if w:
		w = w[0]
	return render_template('worship_notes.html', songs=songs, id=id, w=w, tab=tab)

@app.route("/slides/admin1")
def sildes_admin1():
	_init_slide()
	global client
	client = {'admin': [], 'lead': [], 'musician': [], 'view': []}
	return slides_data

@app.route("/slides")
@app.route("/slides/<mode>")
def slides_viewer(mode=None):
	__update_client_mode(mode)
	if not mode:
		return render_template('slides.html', presentation=slides_data, mode='')
	if not slides_data['data']:
		__get_slide_json()
	if mode == 'admin':
		if len(client['admin']) > 0:
			__update_client_mode('')
			return "<script>alert('Only one Admin mode can be connected, please use different mode.');window.location.replace('../slides');</script>"
		return render_template('slides_admin.html', presentation=slides_data)
	elif mode == 'lead':
		if len(client['lead']) > 0:
			__update_client_mode('')
			return "<script>alert('Only one Lead mode can be connected, please use different mode.');window.location.replace('../slides');</script>"
		return render_template('slides.html', presentation=slides_data, mode=mode)
	return render_template('slides.html', presentation=slides_data, mode=mode)


@app.route("/notes")
def get_notes():
	'''
	:param id (rowid) from song_set
	:return: pre-filled or empty notes.html template
	'''

	id = request.args.get('id', None)
	content = []
	if id:
		content = Utils.get_info_by_id(id)
	return render_template("notes.html", content=content)

@app.route("/song/list")
def get_songs():
	'''
	:param: none
	:return: all song
	'''
	songs = Utils.get_songs()
	return render_template('song_list.html', songs=songs)

@app.route("/sheet/<id>")
def get_song_sheet(id):
	'''
	:param id: song_id
	:param keys: comma number
	:return: sheet object with ABC content, sheet link, and transpose numbers
	'''
	keys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
	keys_1 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
	keyof = request.args.get('keyof', '0,1,2,3,4,5,6,7,8,9,10,11') # when no key is present, return all keys
	keyof = keyof.split(',')

	sheet, key = Utils.get_song_sheet(id)
	if key:
		k_init = keys.index(key) if key in keys else keys_1.index(key)
		keyof_ = [k_init+int(x) for x in keyof]
		for i in range(0, len(keyof_)): # adjust index when value is 12 or over
			keyof_[i] = keyof_[i]-12 if keyof_[i] > 11 else keyof_[i]
		sheet['keyof_name'] = [keys[x] for x in keyof_]
		keyof = [keys[int(x)] for x in keyof] # Translate int to key name
		sheet['keyof'] = keyof
	return render_template('sheet.html', sheets=sheet)

@app.route("/chords/<ids>")
def get_song_chords(ids):
	ids = ids.split(',')
	chords = Utils.get_song_chords(ids)
	return render_template('chords.html', chords=chords)

@app.route("/sheets")
@app.route("/sheets/<ids>")
def get_song_sheet1(ids=None):
	'''
	:param ids: song_ids
	:return: sheet object with ABC content, sheet link, and transpose numbers
	'''
	if not ids:
		sheets = Utils.get_song_sheet()
		sheets = [x for x in sheets if x["abc"] != '']
		return render_template('sheet.html', sheets=sheets)

	keys_1 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
	keys_2 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

	keyof = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

	ids = ids.split(',')
	sheets = Utils.get_song_sheet(ids)
	for sheet in sheets:
		if sheet['key']:
			keys = []
			if sheet['key'] in keys_1:
				k_init = keys_1.index(sheet['key'])
				keys = keys_1
			else:
				k_init = keys_2.index(sheet['key'])
				keys = keys_1
			keyof = [x - k_init for x in keyof]
			for i in range(0, len(keyof)): # adjust index when value is less than 0
				keyof[i] = keyof[i]+12 if keyof[i] < 0 else keyof[i]

			sheet['keyof_name'] = keys
			keyof_name = [keys[x] for x in keyof] # Translate int to key name
			sheet['keyof'] = keyof_name
	return render_template('sheet.html', sheets=sheets)

@app.route("/song/<id>")
def get_song_by_id(id):
	'''
	:param id: song_id
	:param db: dB name, default worship.db
	:param lang: lang of the song
	:return: pre-filled data in song_editor
	'''

	if id == '-1':
		return render_template('song_editor.html', content={'id':-1})
	db = request.args.get('db', 'worship.db')
	lang = request.args.get('lang', None)
	if db != 'worship.db':
		content = Utils.get_song_by_id_(id, db)
		if "lang" not in content:
			content["lang"] = lang
		if "bible" not in content:
			content["bible"] = ''
		return render_template('song_editor.html', content=content)
	else:
		content = Utils.get_song_by_id(id)
		content["lyrics"] = content["lyrics_raw"]  # add key lyrics to be used by song_editor
		return render_template('song_editor.html', content=content)

@app.route("/schedule")
def schedule():
	now = datetime.now()
	year = str(now.year)
	column, schedule = Utils.get_schedule(year)
	return render_template('schedule.html', column=column, schedule=schedule)

@app.route("/calendar")
def calendar():
	now = datetime.now()
	year = str(now.year)
	allsundays = Tools.allsundays()[1]
	assigned = []
	booked = Utils.list_team(year)
	for sun in allsundays:
		if any(x for x in booked if x['date'] == sun):
			assigned.append([sun, [x for x in booked if x['date'] == sun]])
		else:
			assigned.append([sun, []])
	team = Utils.list_team()
	marked = Utils.get_marked_user()
	return render_template('calendar.html', booked=assigned, team=team, marked=marked)


@app.route("/schedule1")
def _schedule():
	'''
	:return: schedule page with available team, role for all sundays
	'''

	sundays = Tools.allsundays()
	assigned = Utils.get_availablity()
	team = Utils.list_team()
	inst = Utils.list_instrument()
	return render_template('schedule.html', assigned=assigned, team=team, sundays=sundays, inst=inst)

@app.route("/profile")
def profile():
	team = Utils.list_team()
	return render_template('profile.html', team=team)

@app.route("/report/<id>")
def report(id):
	worship = Utils.get_worship(id)
	previous = Utils.get_worship(int(id)-1)
	report_template = Tools.get_report(id)
	worship_date = worship['date']
	info = Utils.get_info(worship_date)
	announcement = [x['info'] for x in info if x['type'] == 'announcement']
	prayer = [x['info'] for x in info if x['type'] == 'caring']
	l = Utils.get_schedule_by_id(int(id))
	if 'pdf' in request.args:
		return render_template('report_pdf.html', w=worship, p=previous, template=report_template, announcement=announcement, prayer=prayer, l=l)
	return render_template('report_pdf.html', w=worship, p=previous, template=report_template, announcement=announcement, prayer=prayer, l=l)

@app.route("/files")
def file_list():
	'''
	:return: Return a list of easyslides zip file that's been exported
	'''

	path = Utils.conf["easyslides"]["path"].format('')
	files = os.listdir(os.path.dirname(path))
	files = [{'filename': x, 'path': os.path.join(path, x)} for x in files if os.path.isfile(os.path.join(path, x))]
	worship_path = Utils.conf["worship"]["path"]
	json_files = os.listdir(worship_path)
	json_files = [{'date': x.split('_')[0], 'id': x.split('_')[1].split('.')[0], 'path': os.path.join(worship_path, x)} for x in json_files]
	return render_template('files.html', zip=files, json=json_files)

@app.route("/playground/<name>")
def playground(name):
	'''
	This endpoint is for testinf purpose, name will be pointed to each testing template
	:param name:  name
	'''
	return render_template(name+'.html')

def _init_slide():
	global slides_data
	slides_data = {'pos': [0, 0], 'data': [], 'msg': '', 'dynamic': '', 'key': 0, 'background': [], 'id': 0}

def __update_client(mode, id):
	if mode:
		global client
		if mode == 'admin':
			if len(client[mode]) == 0:
				client[mode].append(id)
		elif mode == 'lead':
			if len(client[mode]) == 0:
				client[mode].append(id)

def __update_client_mode(name):
	global client_mode
	client_mode = name

def __get_slide_json():
	coming_sunday = Tools.allsundays()[0]
	id = Utils.get_worship_id(coming_sunday)[0]
	slides = Tools.get_worship_json(id)
	global slides_data
	if not slides:
		return None
	slides_data['id'] = id
	slides_data['data'] = slides
	slides_data['pos'] = [0, 0]
	if slides[0]['type'] == 'song':
		slides_data['key'] = slides[0]['transpose'][0]
	slides_data['msg'] = ''
	slides_data['dynamic'] = ''
	return True

if __name__ == '__main__':
	app.run(host="0.0.0.0", port=80, debug=True)
