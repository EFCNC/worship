#coding: utf-8
import os.path

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from app import utils as Utils
from app import tools as Tools
from api import api
import json

app = Flask(__name__)
# register blueprint of API
app.register_blueprint(api, url_prefix='/API')

slides_data = {'pos': [0, 0], 'data': [], 'msg': '', 'dynamic': '', 'key': 0, 'background': []}
client = {'admin': 1, 'lead': 1, 'musician': 10, 'view': 10}

# SocketIO section, for presentation control

socketio = SocketIO(app)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnecting')
def handle_disconnect(data):
	print('Client disconnected: {}'.format(data["mode"]))
	#global client
	#client[data["mode"]] -= 1 if client['admin'] > 0 else 0

@socketio.on('control')
def handle_control(data):
	print('Received message:', data)
	global slides_data
	if data['type'] == 'pos':
		slides_data['dynamic'] = ''
		if slides_data['pos'][0] != data['value'][0]:
			slides_data['key'] = 0
	slides_data[data['type']] = data['value']
	emit('response', slides_data, broadcast=True)

@socketio.on('msg')
def handle_announcement(data):
	print("msg", data)
	emit('announcement', data, brodcasr=True)
	#json = Tools.edit_worship_json(id, content, slides_pos[0])
	#if json:
	#	emit('reload', json, broadcast=True)

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
	songs = Utils.get_worship_songs(id)
	w = Utils.worship_list(id)[0]
	return render_template('worship_notes.html', songs=songs, id=id, w=w)

@app.route("/slides/admin")
def sildes_admin():
	global client
	#if client['admin'] == 0:
	#	return "Only one Admin client can be connected!!"
	#client['admin'] -= 1
	id = request.args.get('id', None)
	bg = request.args.get('bg', None)
	if id:
		slides = Tools.get_worship_json(id)
		if slides is None:
			return "Worship slides not found!!", 400
		bg_files = []
		if bg:
			bg_files = Tools.get_background_files()
		global slides_data
		slides_data['data'] = slides
		slides_data['pos'] = [0, 0]
		slides_data['msg'] = ''
		slides_data['dynamic'] = ''
		slides_data['background'] = bg_files
		return render_template('slides_admin.html', presentation=slides_data, id=id)
	else:
		files = Tools.list_worship_file()
		return render_template('slides_admin.html', files=files)

@app.route("/slides")
@app.route("/slides/<mode>")
def slides_viewer(mode=None):
	if mode:
		global client
		if client[mode] == 0:
			return "No more seat for connection!!"
		client[mode] -= 1
		return slides_data
	return render_template('slides.html', presentation=slides_data)


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

@app.route("/song/<id>")
def get_song_by_id(id):
	'''
	:param id: song_id
	:param db: dB name, default worship.db
	:param lang: lang of the song
	:return: pre-filled data in song_editor
	'''

	if id == '-1':
		return render_template('song_editor.html', content=[])
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
		content = Utils.get_song_by_id(id)[0]
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

	path = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'files', 'xml')
	files = os.listdir(path)
	files = [{'filename': x, 'path': os.path.join(path, x)} for x in files if os.path.isfile(os.path.join(path, x))]
	worship_path = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'files', 'json')
	json_files = os.listdir(worship_path)
	json_files = [{'date': x.split('_')[0], 'id': x.split('_')[1].split('.')[0], 'path': os.path.join(worship_path, x)} for x in json_files]
	return render_template('files.html', zip=files, json=json_files)

@app.route("/1")
def t():
	return render_template('1.html')

@app.route("/playground/<name>")
def playground(name):
	'''
	This endpoint is for testinf purpose, name will be pointed to each testing template
	:param name:  name
	'''
	return render_template(name+'.html')

if __name__ == '__main__':
	app.run(host="0.0.0.0", port=80, debug=True)
