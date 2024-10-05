#coding: utf-8
from flask import Flask, render_template, request, send_file
from app import utils as Utils

app = Flask(__name__)

@app.route("/")
def index():
	return render_template('index.html', msg="Hello from 5300")

@app.route("/API/search")
def search_song():
	keyword = request.args.get('keyword', None)
	return Utils.search_songs(keyword)

@app.route("/API/search/bible")
def search_bible():
	keyword = request.args.get('keyword', None)
	result = Utils.search_bible(keyword)
	return result

@app.route("/API/song/<id>")
def get_song(id):
	return Utils.get_song_by_id(id)

@app.route("/test")
def test():
	return render_template('test.html')

if __name__ == '__main__':
	app.run(host="0.0.0.0", port=304, debug=True)
