#coding: utf-8
import os.path

from flask import Flask, render_template, request, send_file
from app import utils as Utils
from app import tools as Tools

app = Flask(__name__)

@app.route("/playground/<name>")
def playground(name):
	return render_template(name+'.html')

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

@app.route("/preview")
def preview():
	id = request.args.get('id', None)
	inline = request.args.get('inline', None)
	songs = Utils.get_worship_songs(id)
	w = Utils.get_worship(id)
	if inline:
		return songs
	return render_template('preview.html', presentation=songs, id=id, w=w)

@app.route("/API/notes", methods=["POST", "GET"])
def edit_notes():
	'''
	:param id (rowid) from song_set
	:return: content of bible or None
	'''

	id = request.args.get('id', None)
	if request.method == 'POST':
		pass
	content = []
	if id:
		content = Utils.get_bible_by_id(id)
	return render_template("notes.html", content=content)

@app.route("/API/search")
def search_song():
	keyword = request.args.get('keyword', None)
	right = Utils.search_song_efcnc(keyword)
	left = Utils.search_songs(keyword)
	return {'left': left, 'right': right}, 200

@app.route("/API/bible/books")
def list_book():
	result = Utils.bible_book()
	return result

@app.route("/API/search/bible")
def search_bible():
	keywords = request.args.get('keywords', None)
	page = request.args.get('page', 0)
	range = request.args.get('range', None)
	page = int(page)*10
	result = Utils.search_bible(keywords, page, range)
	print(result)
	if result[1] != 200:
		return result
	verses = result[0]["data"]["verses"]
	return verses

@app.route("/API/inst_team/<id>")
def arrange_team(id):
	content = Utils.get_worship_teams(id)
	return {'team': content[0], 'inst': content[1], 'roster': content[2]}

@app.route("/API/song/<id>")
def get_song(id):
	db = request.args.get('db', 'worship.db')
	lang = request.args.get('lang', None)
	data = request.args.get('data', None)
	if db != 'worship.db':
		content = Utils.get_song_by_id_(id, db)
		if "lang" not in content:
			content["lang"] = lang
		if "bible" not in content:
			content["bible"] = ''
		return render_template('song_editor.html', content=content)
	else:
		if data:
			content = Utils.get_song_by_id(id)
			return content
		content = Utils.get_song_by_id(id)[0]
		content["lyrics"] = content["lyrics_raw"]  # add key lyrics to be used by song_editor
		return render_template('song_editor.html', content=content)

@app.route("/API/song/<id>/edit", methods=["POST"])
def edit_song(id):
	song = request.get_json()
	result = Utils.edit_song(id, song)
	if result[1] == 200:
		return "Lyrics has been updated successfully!!", 200
	return result[0], 500

@app.route("/API/roles/<date>", methods=["POST", "GET"])
def get_roles(date):
	if request.method == 'POST':
		content = request.get_json()
		result = Utils.edit_role(date, [content], delete=False)
		return result
	team = Utils.list_team(date)
	return team, 200

@app.route("/API/song/add", methods=["POST"])
def add_song():
	song = request.form
	title = song['title']
	result = Utils.get_song_by_title(title)
	if result:
		return result, 400
	Utils.add_song(song)

@app.route("/API/role/edit/<date>", methods=["POST"])
def edit_role(date):
	content = request.get_json()
	result = Utils.edit_role(date, content)
	return result

@app.route("/API/worship/<id>/edit", methods=["POST"])
def edit_worship(id):
	content = request.get_json()
	result = Utils.edit_songset(int(id), content)
	return result

@app.route("/API/worship/<id>/export")
def export(id):
	try:
		result = Tools.create_xml(Utils.get_worship_songs(id))
		return result, 200
	except Exception as e:
		return e, 500
@app.route("/API/download/<path>")
def download(path):
	base = Utils.conf["easyslides"]["path"].format('')
	return send_file(os.path.join(os.path.dirname(base), path), as_attachment=True)

@app.route("/files")
def file_list():
	path = Utils.conf["easyslides"]["path"].format('')
	files = os.listdir(os.path.dirname(path))
	files = [{'filename': x, 'path': os.path.join(path, x)} for x in files if os.path.isfile(os.path.join(path, x))]
	return render_template('files.html', files=files)

@app.route("/schedule")
def schedule():
	sundays = Tools.allsundays()
	assigned = Utils.get_availablity()
	team = Utils.list_team()
	inst = Utils.list_instrument()
	print(sundays)
	return render_template('schedule.html', assigned=assigned, team=team, sundays=sundays, inst=inst)

@app.route("/test")
def test():
	sundays = Tools.allsundays()
	worship = Utils.worship_list()
	worship = [{'date': x, 'worship': next((y for y in worship if y['date'] == x), '')} for x in sundays]
	return render_template('test.html', worship=worship, sundays=sundays)

@app.route("/1")
def t():
	return render_template("1.html")

if __name__ == '__main__':
	app.run(host="0.0.0.0", port=304, debug=True)
