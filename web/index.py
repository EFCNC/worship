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

# Add cache headers for static (profile picture) images to reduce bandwidth
@app.after_request
def add_cache_headers(response):
    if request.path.startswith('/static/img/'):
        # Cache images for 30 days
        response.headers['Cache-Control'] = 'public, max-age=2592000, immutable'
    return response

slides_data = {'pos': [0, 0, 0], 'data': [], 'setting': {'slide_order': ["promote", "welcome", "announcement", "song", "sermon", "offering", "caring", "benediction"], 'assets': []}, 'msg': '', 'dynamic': '', 'key': 0, 'background': [], 'id': 0, 'assets': []}
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
	slides_data['from'] = data['from']
	emit('response', slides_data, broadcast=True)

@socketio.on('msg')
def handle_announcement(data):
	print("msg", data)
	emit('announcement', data, broadcast=True)

# Inject ID into page using context processor
@app.context_processor
def inject_worship_id():
    # This runs automatically before any template is rendered
    coming_sunday = __get_sundays()["sunday"]
    worship_id = Utils.get_worship_id(coming_sunday)[0]
    return dict(worship_id=worship_id)

# Rendering interfaces

# --------- Home and Profile Page ---------
@app.route("/")
def index():
	return render_template('home.html')

@app.route("/profile")
def profile():
	team = Utils.list_team()
	return render_template('profile.html', team=team)

# -------- Worship Pages ---------
@app.route("/worship")
def worship_home():
	id = request.args.get('id', None)
	if id:
		songs = Utils.get_worship_songs(id)
		w = Utils.get_worship(id)
		return render_template('worship/songs.html', songs=songs, id=id, w=w)
	sundays = Tools.allsundays()
	worship = Utils.worship_list()
	worship = [{'date': x, 'worship': next((y for y in worship if y['date'] == x), -1)} for x in sundays[1]]
	return render_template('worship/worship.html', worship=worship, sundays=sundays)

@app.route("/worship/<id>")
@app.route("/worship/<id>/<tab>")
def worship(id, tab=''):
	json_file = request.args.get('json', None)
	if json_file:
		json_file = Tools.get_worship_json(id)
		if json_file:
			return render_template('json.html', json=json.dumps(json_file, indent=2, ensure_ascii=False, sort_keys=True), id=id)
		return "No Slides available", 400

	songs = Utils.get_worship_songs(id)
	w = Utils.worship_list(id)
	if w:
		w = w[0]
	return render_template('worship/notes.html', songs=songs, id=id, w=w, tab=tab)

@app.route("/worship/schedule")
def schedule():
	now = datetime.now()
	year = str(now.year)
	sundays = __get_sundays()
	allsundays = sundays['all']
	assigned = []
	booked = Utils.list_team(year)
	for sun in allsundays:
		if any(x for x in booked if x['date'] == sun):
			assigned.append([sun, [x for x in booked if x['date'] == sun]])
		else:
			assigned.append([sun, []])
	team = Utils.list_team()
	marked = Utils.get_marked_user()
	return render_template('worship/schedule.html', booked=assigned, team=team, marked=marked, sunday=sundays['sunday'])

@app.route("/song/list")
def song_list():
	'''
	:param: none
	:return: all song
	'''
	songs = Utils.get_songs()
	return render_template('song/song_list.html', songs=songs)

@app.route("/worship/chords/<ids>")
def get_song_chords(ids):
	ids = ids.split(',')
	chords = Utils.get_song_chords(ids)
	return render_template('/worship/chords.html', chords=chords)

@app.route("/worship/sheets")
@app.route("/worship/sheets/<ids>")
def get_song_sheet(ids=None):
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
		sheet['transpose_amount'] = 0

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
	return render_template('worship/sheets.html', sheets=sheets)

@app.route("/worship/sheets/weekly/<id>")
def get_weekly_sheets(id):
    songs = Utils.get_worship_songs(id)
    
    ids = [str(song['id']) for song in songs]
    # print(ids)
    sheets = Utils.get_song_sheet(ids)
    # print(sheets)
    keys_1 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    keys_2 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

    for sheet in sheets:
        sheet_id = sheet.get("id")
        print(sheet_id)
        weekly_data = next((song for song in songs if str(song.get("id")) == str(sheet_id)), None)

        if weekly_data and 'transpose' in weekly_data:
            t_val = weekly_data['transpose']
            print(int(t_val[0]))
            sheet['transpose_amount'] = int(t_val[0])
        else:
            sheet['transpose_amount'] = 0

        song_key = sheet.get('song_key')
        if song_key:
            keyof = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            if song_key in keys_1:
                k_init = keys_1.index(song_key)
                keys = keys_1
            else:
                k_init = keys_2.index(song_key)
                keys = keys_2
            
            keyof = [(x - k_init) % 12 for x in keyof]

            sheet['keyof_name'] = keys
            sheet['keyof'] = [keys[x] for x in keyof]

    return render_template('worship/sheets.html', songs=songs, sheets=sheets)
# @app.route("/song/<id>")
# def get_song_by_id(id):
# 	'''
# 	:param id: song_id
# 	:param db: dB name, default worship.db
# 	:param lang: lang of the song
# 	:return: pre-filled data in song_editor
# 	'''

# 	if id == '-1':
# 		return render_template('song_editor.html', content={'id':-1})
# 	db = request.args.get('db', 'worship.db')
# 	lang = request.args.get('lang', None)
# 	if db != 'worship.db':
# 		content = Utils.get_song_by_id_(id, db)
# 		if "lang" not in content:
# 			content["lang"] = lang
# 		if "bible" not in content:
# 			content["bible"] = ''
# 		return render_template('song_editor.html', content=content)
# 	else:
# 		content = Utils.get_song_by_id(id)
# 		content["lyrics"] = content["lyrics_raw"]  # add key lyrics to be used by song_editor
# 		return render_template('song_editor.html', content=content)

@app.route("/song/<id>/edit") # Changed path
def edit_song(id): # Renamed for clarity
    '''
    :param id: song_id
    :return: song_editor.html
    '''

    # Handle creating a new song
    if id == '-1':
        return render_template('song/song_editor.html', content={'id': -1})
    
    db = request.args.get('db', 'worship.db')
    lang = request.args.get('lang', None)
    
    if db != 'worship.db':
        content = Utils.get_song_by_id_(id, db)
        if "lang" not in content:
            content["lang"] = lang
        if "bible" not in content:
            content["bible"] = ''
    else:
        content = Utils.get_song_by_id(id)
        # add key lyrics to be used by song_editor
        content["lyrics"] = content["lyrics_raw"] 
        
    return render_template('song/song_editor.html', content=content)


@app.route("/assets")
def assets():
	setting = slides_data['setting']
	assets = sorted(setting['assets'], key=lambda d: d['type'])
	promote = [x for x in setting['assets'] if x['inused'] == 1]
	print(assets, promote)

	return render_template('slides_assets.html', setting=setting, assets=assets, promote=promote)

# @app.route("/people")
# def people():
# 	people = Utils.get_teams()
# 	return render_template('people.html', people=people)

# -------- Slides Pages ---------

# I think this one is specifically to reset a locked admin or lead page. We could make it slides/reset in the future.
@app.route("/slides/admin1")
def sildes_admin1():
	_init_slide()
	global client
	client = {'admin': [], 'lead': [], 'musician': [], 'view': []}
	return slides_data

@app.route("/slides")
def slides():
	return render_template('slides/slides.html')

@app.route("/slides/<mode>")
def slides_viewer(mode=None):
	__update_client_mode(mode)
	if not mode:
		return render_template('slides/slides.html', presentation=slides_data, mode='')
	if not slides_data['data']:
		__get_slide_json()
	if mode == 'admin':
		if len(client['admin']) > 0:
			__update_client_mode('')
			return "<script>alert('Only one Admin mode can be connected, please use different mode.');window.location.replace('../slides');</script>"
		else:
			return render_template('slides/slides_admin.html', presentation=slides_data, mode=mode)
	elif mode == 'lead':
		if len(client['lead']) > 0:
			__update_client_mode('')
			return "<script>alert('Only one Lead mode can be connected, please use different mode.');window.location.replace('../slides');</script>"
		return render_template('slides/slides_lead.html', presentation=slides_data, mode=mode)
	elif mode == 'view':
		__update_client_mode('')
		return render_template('slides/slides_view.html', presentation=slides_data, mode=mode)
	elif mode == 'score':
		
		__update_client_mode('')
		coming_sunday = __get_sundays()["sunday"]
		id = Utils.get_worship_id(coming_sunday)[0]	
		w = Utils.worship_list(id)
		if w:
			w = w[0]

		songs = Utils.get_worship_songs(id)
		
		return render_template('slides/slides_score.html', presentation=slides_data, mode=mode, id=id, w=w, songs=songs)
	
	return render_template('slides/slides.html', presentation=slides_data, mode=mode)

# --------- Admin Pages ---------
@app.route("/admin")
def admin_home():
	coming_sunday = __get_sundays()["sunday"]
	id = Utils.get_worship_id(coming_sunday)[0]
	return render_template('admin/home.html', id=id)

@app.route("/admin/info")
def admin_info():
	coming_sunday = __get_sundays()["sunday"]
	id = Utils.get_worship_id(coming_sunday)[0]
	return render_template('admin/info.html', id=id)

@app.route("/admin/people")
def admin_people():
	id = request.args.get('id', None)
	groups = Utils.get_groups()
	sundays = __get_sundays()
	if not id:
		people = Utils.get_team_present(sundays['worship_id'])
	else:
		people = Utils.get_team_present(id)
	return render_template('admin/people.html', people=people, groups=[x[1] for x in groups], sundays=sundays)

@app.route("/admin/calendar")
def admin_calendar():
	now = datetime.now()
	year = str(now.year)
	column, calendar = Utils.get_calendar(year)
	return render_template('admin/calendar.html', column=column, calendar=calendar)

@app.route("/admin/report/<id>")
def admin_report(id):
	report, saved = Tools.get_report(id)
	return render_template('admin/report_pdf.html', saved=saved, report=report, id=id)


# --------- Other Pages ---------
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

def __get_sundays():
	sundays = Tools.allsundays()
	id = Utils.get_worship_id(sundays[0])[0]
	return dict(sunday=sundays[0], all=sundays[1], worship_id=id)

def _init_slide():
	global slides_data
	slides_data = {'pos': [0, 0], 'data': [], 'setting': {'slide_order': ["promote", "welcome", "announcement", "song", "sermon", "offering", "caring", "benediction"], 'assets': []}, 'msg': '', 'dynamic': '', 'key': 0, 'background': [], 'id': 0, 'assets': []}

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
	coming_sunday = __get_sundays()["sunday"]
	id = Utils.get_worship_id(coming_sunday)[0]
	slides = Tools.get_worship_json(id)
	global slides_data
	if not slides:
		Tools.create_json(id)
		slides = Tools.get_worship_json(id)
	setting = slides['setting']
	slide = slides['slides']
	slides_data['id'] = id
	slides_data['data'] = slide
	slides_data['setting'] = setting
	slides_data['pos'] = [0, 0]
	slides_data['msg'] = ''
	slides_data['dynamic'] = ''
	return True

if __name__ == '__main__':
	app.run(host="0.0.0.0", port=5000, debug=True)
