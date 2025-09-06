#coding: utf-8
import os.path

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

@socketio.on('reload')
def reload_json():
	print('Reloading json data')
	if __get_slide_json():
		emit('reload', slides_data, broadcast=True)

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

@app.route("/worship/<id>")
def worship_notes(id):
	json_file = request.args.get('json', None)
	if json_file:
		json_file = Tools.get_worship_json(id)
		if json_file:
			return render_template('json.html', json=json.dumps(json_file, indent=2, ensure_ascii=False), id=id)
		return "No Slides available", 400

	songs = Utils.get_worship_songs(id)
	w = Utils.worship_list(id)[0]
	return render_template('worship_notes.html', songs=songs, id=id, w=w)

@app.route("/slides/admin1")
def sildes_admin1():
	id = request.args.get('id', None)
	if id:
		slides = __get_slide_json()
		if slides:
			return render_template('slides_admin.html', presentation=slides_data)
		return "Worship slides not found!!", 400
	else:
		files = Tools.list_worship_file()
		id = slides_data["id"]
		return render_template('slide_list.html', files=files, id=id)

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
		content = Utils.get_bible_by_id(id)
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

@app.route("/sheets/<ids>")
def get_song_sheet1(ids):
	'''
	:param ids: song_ids
	:return: sheet object with ABC content, sheet link, and transpose numbers
	'''
	keys_1 = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
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
	'''
	:return: schedule page with available team, role for all sundays
	'''

	sundays = Tools.allsundays()
	assigned = Utils.get_availablity()
	team = Utils.list_team()
	inst = Utils.list_instrument()
	return render_template('schedule.html', assigned=assigned, team=team, sundays=sundays, inst=inst)

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

@app.route("/1")
def t():
	return slides_data

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
