import sqlite3
import requests
import json
import os
import re
import opencc
from app import db as dB
from app import parser as Parser
import hanzidentifier

path = os.path.dirname(os.path.realpath(__file__))
with open(os.path.join(path, 'conf.json')) as json_file:
    conf = json.loads(json.dumps(json.load(json_file)))

search_db = conf["db"]["imported"]

def search_songs(keyword, match=None):
    titles = []
    for db in search_db:
        # Split keywords from space
        new_keyword = keyword.split(' ')
        if db["enabled"] == 1:
            if db["lang"] == 'zh-CN':  # covert traditional chinese to simplified
                converter = opencc.OpenCC('t2s.json')
                new_keyword = [converter.convert(x) for x in new_keyword]
            para = {
                "name": db["name"],
                "sql": db["search"]["query"],
                "keywords": new_keyword,
                "match": 'like',
                "result": 'or',
                "cols": db["search"]["columns"]
            }
            result = dB.search(para)
        titles += [{'id': x[0], 'title': x[1], 'db': db["name"], 'lang': x[2] if x[2] else db["name"].split('.')[0]} for x in result if len(result)>0]
    return titles

def search_song_efcnc(keyword):
    db = conf["db"]["default"]
    new_keyword = keyword.split(' ')
    para = {
        "name": db["name"],
        "sql": db["search"]["query"],
        "keywords": new_keyword,
        "match": 'like',
        "result": 'or',
        "cols": db["search"]["columns"]
    }
    result = dB.search(para)
    titles = [{'id': x[0], 'title': x[1], 'lang': x[2] if x[2] else '', 'lang_2': x[3] if x[3] else '', 'key': x[4] if x[4] else '', 'video': x[5] if x[5] else '', 'score': x[6] if x[6] else ''} for x in result]
    return titles

def bible_book():
    key = conf["bibleAPI"]["key"]
    endpoint = conf["bibleAPI"]["url"]
    version = conf["bibleAPI"]["version"]["en"][0]["key"]
    url = 'https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-01/books'
    headers = {'api-key': key, 'Content-Type': 'application/json'}
    content = requests.get(url, headers=headers)
    print(content)
    return content.json()

def search_bible(keyword, offset, range=None):
    if hanzidentifier.has_chinese(keyword):
        version = conf["bibleAPI"]["version"]["zh"][0]["key"]
    else:
        version = conf["bibleAPI"]["version"]["en"][0]["key"]
    key = conf["bibleAPI"]["key"]
    endpoint = conf["bibleAPI"]["url"]
    search_url = endpoint + '/bibles/' + version + '/search?query=' + keyword + '&offset=' + str(offset);
    if range:
        search_url += '&range=' + range
    headers = {'api-key': key, 'Content-Type': 'application/json'}
    try:
        content = requests.get(search_url, headers=headers)
        if content.status_code == 200:
            return content.json(), 200
        else:
            return content.reason, 400
    except Exception as e:
        print('bible API error', e)
        return e, 500

def list_instrument(exclude=None):
    if exclude:
        sql = "select id, name from instrument where name not in(?) order by id"
        result = dB.run_para(sql, exclude)
    else:
        sql = "select id, name from instrument order by id"
        result = dB.run(sql)
    inst = []
    for r in result:
        inst.append({'id': r[0], 'name': r[1]})
    return inst

def list_team(date=None):
    team = []
    if date:
        sql = 'select it.user_id, name, name_2, it.instrument_id from team t inner join instrument_team it on it.user_id = t.user_id where it.available_date = ?'
        result = dB.run_para(sql, date)
        seen = []
        for r in result:
            if not any(x for x in seen if x['id'] == r[0]):
                team.append({'id': r[0], 'name': r[1], 'name_2': r[2]})
            seen.append({'id': r[0], 'role_id': r[3]})
        for role in team:
            role_ids = [y['role_id'] for y in seen if y['id'] == role['id']]
            role["roles"] = role_ids
        return team
    else:
        sql = "select user_id, name, name_2 from team order by name"
        result = dB.run(sql)
        for r in result:
            team.append({'id': r[0], 'name': r[1], 'name_2': r[2]})
    return team

def get_worship_teams(id):
    team = list_team()
    inst = list_instrument()
    roster = []
    sql = 'select t.name, t.name_2, i.name, i.id, t.user_id from instrument_team it inner join team t on t.user_id = it.user_id inner join instrument i on it.instrument_id = i.id where worship_id=? order by i.id'
    result = dB.run_para(sql, id)
    for r in result:
        roster.append({'id': r[3], 'user_id': r[4], 'user_name': r[0], 'user_name_2': r[1], 'inst_name': r[2]})
    return team, inst, roster

def get_bible_by_id(id):
    sql = "select rowid, notes, bible, version from song_set where rowid = ?"
    r = dB.run_para(sql, id)[0]
    return {'rowid': r[0], 'notes': r[1], 'bible': r[2] if r[2] else '', 'version': r[3] if r[3] else ''}

def get_song_by_id_(id, db_name):
    db = [x for x in conf["db"]["imported"] if x["name"] == db_name]
    sql = db[0]["get_song"]
    lang = db[0]["lang"]
    x = dB.run_para(sql, id, db_name)[0]
    content = Parser.parse_lyrics_for_import(x[4]) # index 4: lyrics
    if lang == "zh-CN":
        converter = opencc.OpenCC('s2t.json')
        # convert title, bookname, lyrics, copyright to traditional chinese
        song = {'id': x[0], 'book_name': converter.convert(x[2]) if x[2] else '', 'title': converter.convert(x[1]), 'lyrics': converter.convert(content[0]), 'sequence': content[1], 'copyright': converter.convert(x[5]) if x[4] else '', 'ccli': x[6] if x[6] else '', 'song_number': x[7], 'file': x[8] if x[8] else ''}
    elif lang == 'en':
        song = {'id': x[0], 'book_name': x[2] if x[2] else '', 'title': x[1], 'lyrics': content[0], 'sequence': content[1], 'copyright': x[5] if x[5] else '', 'ccli': x[6] if x[6] else '', 'song_number': x[7], 'file': x[8] if x[8] else ''}
    else:  # stream_of_song
        song = {'id': x[0], 'book_name': x[2] if x[2] else '', 'title': x[1], 'lyrics': content[0], 'sequence': content[1], 'copyright': x[5] if x[5] else '', 'ccli': x[6] if x[6] else '', 'song_number': x[7], 'lang': x[3] if x[3] else '', 'author': x[8] if x[8] else '', 'lyricist': x[9] if x[9] else '', 'key': x[10] if x[10] else ''}

    return song

def get_song_by_id(id):
    sql = "select s.title, s.author, s.lang, s.lang_2, s.song_key, s.sequence, s.bible_verse, s.lyricist, s.book, s.copyright, s.ccli, s.content, (select link from media m where m.song_id=s.song_id and m_type=0) as video, (select link from media m where m.song_id=s.song_id and m_type=1) as score, s.song_id as id from songs s where s.song_id = ?"
    r = dB.run_para(sql, id)[0]
    if r:
        return {'type': 's', 'title': r[0], 'author': r[1] if r[1] else '', 'lang': r[2] if r[2] else '', 'lang_2': r[3] if r[3] else '', 'key': r[4] if r[4] else '', 'sequence': r[5] if r[5] else '', 'bible': r[6] if r[6] else '', 'lyricist': r[7] if r[7] else '', 'book': r[8] if r[8] else '', 'copyright': r[9] if r[9] else '', 'ccli': r[10] if r[10] else '', 'lyrics_raw': r[11], 'content': Parser.parse_lyrics(r[11], r[5]), 'video': r[12] if r[12] else '', 'score': r[13] if r[13] else '', 'id': r[14], 'notes': '', 'transpose': 0, 'alt_sequence': r[5] if r[5] else ''}, 200
    return r, 500

def get_song_by_title(title):
    sql = "select song_id, title from songs where title = ?"
    result = dB.run_para(sql, title)
    if result:
        return "Found title {}".format(title)
    return None

def add_song(content):
    sql = "INSERT INTO songs (title,lang,lang_2,content,song_key,sequence,bible_verse,updated,author,lyricist,book,copyright,ccli) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    values = [content["title"], content["lang"], content["lang2"], content["lyrics"], content["key"], content["sequence"], content["bible"], "strftime('%Y-%m-%d',date('now'))", content["author"], content["lyricist"], content["book_name"], content["copyright"], content["ccli"]]
    song_id = dB.insert(sql, values)
    if song_id[1] == 500:
        return song_id[0]
    media = []
    if content['file']:
        media.append([2, content['file']])
    if content['video']:
        media.append([0, content['video']])
    if content['score']:
        media.append([1, content['score']])
    if len(media):
        sql = "insert into media(song_id, link, m_type) values"
        for m in media:
            sql += "(?, ?, ?),"
        sql = sql[:-1]
        values = []
        for m in media:
            values.append(song_id[0])
            values.append(m[0])
            values.append(m[1])

        result = dB.insert(sql, values)
        return result
    else:
        return song_id

def edit_song(id, content):
    sql = "update songs set"
    values = []
    for key, value in content.items():
        sql += ' {} = ?,'.format(key)
        values.append(value)
    sql = sql[:-1]
    sql += ' where song_id = ?'
    values.append(id)
    return dB.run_para(sql, values)

def edit_role(date, content, delete=True):
    """
    :param date: available_date, content: dict of column name, value
    """
    sql = "insert into instrument_team(user_id, instrument_id, available_date, worship_id) values"
    for item in content:
        sql += '({}, {}, "{}", {}),'.format(item['user_id'], item['role_id'], date, item['worship_id'])
    sql = sql[:-1]
    if delete:
        dB.run_para('delete from instrument_team where available_date = ?', date)
    r = dB.run(sql)
    if r:
        return r, 500
    return '', 200

def edit_songset(id, content):
    """
    :param id: worship_id, content: dict of column name, value
    """
    sql = "insert into song_set(song_id, worship_id, transpose, scheduled_date, sequence, song_order, notes) values"
    for song in content:
        sql += '({}, {}, {}, "{}", "{}", {}, "{}"),'.format(song['song_id'], id, song['transpose'], song['scheduled_date'], song['sequence'], song['song_order'], song['notes'])
    sql = sql[:-1]
    dB.run_para('delete from song_set where worship_id = ?', id)
    return dB.run(sql)

def get_worship(id):
    sql = "select title, notes, scheduled_date, sermon_id from worship where worship_id = ?"
    r = dB.run_para(sql, id)[0]
    return {'date': r[2], 'title': r[0] if r[0] else '', 'notes': r[1] if r[1] else '', 'sermon_id': r[3] if r[3] else ''}

def get_worship_songs(id):
    #sql = "select s.title, s.author, s.lang, s.lang_2, s.song_key, s.sequence, s.bible_verse, s.lyricist, s.book, s.copyright, s.ccli, s.content, (select link from media m where m.song_id=s.song_id and m_type=0) as video, (select link from media m where m.song_id=s.song_id and m_type=1) as score, w.scheduled_date as date, se.song_id as id, se.transpose as transpose, se.sequence alt_sequence, se.notes as notese from song_set se left join songs s on s.song_id = se.song_id  inner join worship w on w.scheduled_date = se.scheduled_date where se.worship_id = ? group by s.song_id order by se.song_order"
    sql = "select s.title, s.author, s.lang, s.lang_2, s.song_key, s.sequence, s.bible_verse, s.lyricist, s.book, s.copyright, s.ccli, s.content, (select link from media m where m.song_id=s.song_id and m_type=0) as video, (select link from media m where m.song_id=s.song_id and m_type=1) as score, w.scheduled_date as date, se.song_id as id, se.transpose as transpose, se.sequence alt_sequence, se.notes as notes, se.bible, se.version, se.rowid from song_set se left join songs s on s.song_id = se.song_id  inner join worship w on w.scheduled_date = se.scheduled_date where se.worship_id = ? order by se.song_order"
    result = dB.run_para(sql, id)
    songs = []
    for r in result:
        if r[15] == -1:
            songs.append({'type': 'i', 'title': r[19] if r[19] else r[18][0:10], 'author': '', 'lang': '', 'lang_2': '', 'key': '', 'sequence': '', 'bible': '', 'lyricist': '', 'book': '', 'copyright': '', 'ccli': '', 'lyrics_raw': '', 'content': '', 'video': '', 'score': '', 'date': r[14], 'id': r[21], 'transpose': r[16], 'alt_sequence': '', 'notes': r[18] if r[18] else '', 'version': r[20] if r[20] else ''})
        else:
            songs.append({'type': 's', 'title': r[0], 'author': r[1] if r[1] else '', 'lang': r[2] if r[2] else '', 'lang_2': r[3] if r[3] else '', 'key': r[4] if r[4] else '', 'sequence': r[5] if r[5] else '', 'bible': r[6] if r[6] else '', 'lyricist': r[7] if r[7] else '', 'book': r[8] if r[8] else '', 'copyright': r[9] if r[9] else '', 'ccli': r[10] if r[10] else '', 'lyrics_raw': r[11], 'content': Parser.parse_lyrics(r[11], r[17]), 'video': r[12] if r[12] else '', 'score': r[13] if r[13] else '', 'date': r[14], 'id': r[15], 'transpose': r[16] if r[16] else 0, 'alt_sequence': r[17] if r[17] else '', 'notes': r[18] if r[18] else ''})
    return songs

def get_availablity():
    sql = 'select it.available_date, t.user_id, t.name, t.name_2, i.id, i.name, it.worship_id from team t inner join instrument_team it on t.user_id = it.user_id inner join instrument i on i.id = it.instrument_id'
    result = dB.run(sql)
    team = []
    for r in result:
        team.append({'date': r[0] if r[0] else '', 'user_id': r[1] if r[1] else '', 'user_name': r[2] if r[2] else '', 'user_name2': r[3] if r[3] else '', 'role_id': r[4] if r[4] else '', 'role': r[5] if r[5] else '', 'worship_id': r[6] if r[6] else -1})
    return team

def worship_list():
    sql = "select s.title, s.speaker, t.name, (select i.name from instrument i where i.id = it.instrument_id), w.title, w.scheduled_date, w.worship_id from worship w inner join sermon s on w.scheduled_date = s.date left join instrument_team it on w.worship_id = it.worship_id left join team t on it.user_id = t.user_id order by w.scheduled_date, it.instrument_id"
    result = dB.run(sql)
    worship = []
    for r in result:
        a = next((x for x in worship if x['date'] == r[5]), None)
        if a:
            a['content'].append({'user_name': r[2], 'role': r[3]})
        else:
            worship.append({'worship_id': r[6], 'date': r[5] if r[5] else '', 'worship_title': r[4] if r[4] else '', 'sermon_title': r[0] if r[0] else '', 'speaker': r[1] if r[1] else '', 'content': [{'user_name': r[2] if r[2] else '', 'role': r[3] if r[3] else ''}]})
    return worship