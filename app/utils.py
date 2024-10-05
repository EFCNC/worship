import sqlite3
import requests
import json
import os
import re
import xml.etree.ElementTree as ET

def search_songs(keyword):
    path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    con = sqlite3.connect(os.path.join(path, 'db', 'en.sqlite'))
    cur = con.cursor()
    sql = "select s.id as id, title, file_name from songs s left join media_files m on s.id = m.song_id where search_title like ?"
    keyword = "%" + keyword +"%"
    result = cur.execute(sql, [keyword]).fetchall()
    titles = [{'id': x[0], 'title': x[1], 'file': x[2]} for x in result]
    return titles

def search_bible(keyword):
    path = os.path.dirname(os.path.realpath(__file__))
    with open(os.path.join(path, 'conf.json')) as json_file:
        conf = json.loads(json.dumps(json.load(json_file)))
    key = conf["bibleAPI"]["key"]
    endpoint = conf["bibleAPI"]["url"]
    version = conf["bibleAPI"]["version"]["en"][0]["key"]
    search_url = endpoint + '/bibles/' + version + '/search?query=' + keyword
    headers = {'api-key': key, 'Content-Type': 'application/json'}
    content = requests.get(search_url, headers=headers)
    if content.status_code == 200:
        return content.json(), 200
    else:
        return "Wrong", 400

def get_song_by_id(id):
    path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    con = sqlite3.connect(os.path.join(path, 'db', 'en.sqlite'))
    cur = con.cursor()
    sql = "select s.id as id, sb.name as bookname, title, lyrics, copyright, ccli_number, song_number, file_name from songs s left join song_books sb on s.song_book_id = sb.id left join media_files m on s.id = m.song_id where s.id = ?"
    result = cur.execute(sql, [id]).fetchall()
    song = [{'id': x[0], 'book_name': x[1], 'title': x[2], 'lyrics': get_lyrics(x[3]), 'copyright': x[4], 'ccli': x[5], 'song_number': x[6], 'file': x[7]} for x in result]
    return song[0]

def get_lyrics(content):
    tree = ET.fromstring(content)
    lyrics = []
    for verse in tree.findall('./lyrics/verse'):
        tag = re.sub(r'\[([^]]+)\]([^\s]+)\s?', '<div class="chord-letter"><span class="chord">\\1</span>\\2</div>', verse.text)
        text = re.sub(r'(\[[^]]+\])', '', verse.text)
        lyrics.append({'label': verse.attrib["label"], 'type': verse.attrib["type"], 'lyrics_tag': tag, 'lyrics': text})
    return lyrics