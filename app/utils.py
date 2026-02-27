import sqlite3
from datetime import date
from time import strftime

import requests
import json
import os
import re
#import opencc
from app import db as dB
from app import parser as Parser

path = os.path.dirname(os.path.realpath(__file__))
with open(os.path.join(path, 'conf.json'), encoding="utf8") as json_file:
    conf = json.loads(json.dumps(json.load(json_file)))

search_db = conf["db"]["imported"]

def search_songs(keyword, match=None):
    titles = []
    for db in search_db:
        # Split keywords from space
        new_keyword = keyword.split(' ')
        if db["enabled"] == 1:
            #if db["lang"] == 'zh-CN':  # covert traditional chinese to simplified
            #    converter = opencc.OpenCC('t2s.json')
            #    new_keyword = [converter.convert(x) for x in new_keyword]
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
    titles = [{'id': x[0], 'title': x[1], 'lang': x[2] if x[2] else '', 'lang_2': x[3] if x[3] else '', 'key': x[4] if x[4] else '', 'video': x[5] if x[5] else '', 'score': x[6] if x[6] else '', 'abc': x[0] if x[7] else ''} for x in result]
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
        sql = 'select it.user_id, t.name, name_2, it.instrument_id, it.available_date, i.name, it.worship_id from team t inner join instrument_team it on it.user_id = t.user_id inner join instrument i on it.instrument_id = i.id where it.available_date like ?'
        result = dB.run_para(sql, '%'+date+'%')
        for r in result:
            team.append({'id': r[0], 'name': r[1], 'name_2': r[2], 'date': r[4], 'instrument': r[5], 'role_id': r[3]})
        return team
    else:
        sql = "select user_id, name, name_2 from team order by name"
        result = dB.run(sql)
        for r in result:
            team.append({'id': r[0], 'name': r[1], 'name_2': r[2]})
    return team

def get_marked_user():
    sql = "select user_id, available_date from instrument_team it where it.instrument_id == -1"
    result = dB.run(sql)
    marked = []
    for r in result:
        marked.append({'date': r[1], 'id': r[0]})
    return marked

def get_worship_teams(id):
    team = list_team()
    inst = list_instrument()
    marked = get_marked_user()
    roster = []
    sql = 'select t.name, t.name_2, i.name, i.id, t.user_id from instrument_team it inner join team t on t.user_id = it.user_id inner join instrument i on it.instrument_id = i.id where  worship_id=? order by i.id'
    result = dB.run_para(sql, id)
    for r in result:
        roster.append({'id': r[3], 'user_id': r[4], 'user_name': r[0], 'user_name_2': r[1], 'inst_name': r[2]})
    return team, inst, roster, marked

def get_info(d):
    sql = "select id, content, type, note, date from info where content is not null and date = ? order by type"
    result = dB.run_para(sql, d)
    info = []
    for r in result:
        info.append({'id': r[0], 'info': r[1], 'type': r[2] if r[2] else '', 'note': r[3] if r[3] else '', 'date': r[4]})
    return info

def get_info_by_id(id):
    sql = "select id, content, type, note from info where id = ?"
    r = dB.run_para(sql, id)[0]
    return {'id': r[0], 'info': r[1], 'type': r[2] if r[2] else '', 'note': r[3] if r[3] else ''}

def del_info_by_id(id):
    sql = "delete from info where id = ?"
    return dB.run_para(sql, id)

def get_song_by_id_(id, db_name):
    db = [x for x in conf["db"]["imported"] if x["name"] == db_name]
    sql = db[0]["get_song"]
    lang = db[0]["lang"]
    x = dB.run_para(sql, id, db_name)[0]
    content = Parser.parse_lyrics_for_import(x[4]) # index 4: lyrics
    #if lang == "zh-CN":
        #converter = opencc.OpenCC('s2t.json')
        # convert title, bookname, lyrics, copyright to traditional chinese
        #song = {'id': x[0], 'book': converter.convert(x[2]) if x[2] else '', 'title': converter.convert(x[1]), 'lyrics': converter.convert(content[0]), 'sequence': content[1], 'copyright': converter.convert(x[5]) if x[4] else '', 'ccli': x[6] if x[6] else '', 'song_number': x[7], 'file': x[8] if x[8] else ''}
    if lang == 'en':
        song = {'id': x[0], 'book': x[2] if x[2] else '', 'title': x[1], 'lyrics': content[0], 'sequence': content[1], 'copyright': x[5] if x[5] else '', 'ccli': x[6] if x[6] else '', 'song_number': x[7], 'file': x[8] if x[8] else ''}
    else:  # stream_of_song
        song = {'id': x[0], 'book': x[2] if x[2] else '', 'title': x[1], 'lyrics': content[0], 'sequence': content[1], 'copyright': x[5] if x[5] else '', 'ccli': x[6] if x[6] else '', 'song_number': x[7], 'lang': x[3] if x[3] else '', 'author': x[8] if x[8] else '', 'lyricist': x[9] if x[9] else '', 'key': x[10] if x[10] else ''}

    return song

def get_songs_para(days, count=None):
    if count:
        sql = "select count(*) count, s.title, s.song_id from presentation p inner join songs s on s.song_id = p.song_id where julianday('now') - julianday(p.scheduled_date) <= {} group by p.song_id order by count desc, s.title".format(days)
        result = dB.run(sql)
        content = []
        for r in result:
            content.append({'count': r[0], 'title': r[1], 'id': r[2]})
        return content
    else:
        sql = "select p.scheduled_date, s.title, s.song_id, s.lang, s.lang_2, s.song_key from presentation p inner join songs s on s.song_id = p.song_id where julianday('now') - julianday(p.scheduled_date) <= {} order by p.scheduled_date desc, s.title".format(days)
        result = dB.run(sql)
        content = {}
        temp = []
        for r in result:
            if r[0] in content.keys():
                temp.append({'id': r[2], 'title': r[1], 'lang': r[3], 'lang_2': r[4] if r[4] else '', 'key': r[5]})
            else:
                content[r[0]] = temp
                temp = []
        return content

def get_songs(ids=None):
    sql = "select s.title, s.author, s.lang, s.lang_2, s.song_key, s.sequence, s.bible_verse, s.lyricist, s.book, s.copyright, s.ccli, s.content, m.link, m.m_type, m.abc, s.song_id as id from songs s left join media m on s.song_id = m.song_id"
    if ids:
        ids = ids.split(',')
        sql += ' where s.song_id in ({ids}) order by s.song_id'.format(ids=','.join(['?']*len(ids)))
        result = dB.run_para(sql, ids)
    else:
        sql += ' order by s.song_id desc'
        result = dB.run(sql)
    songs = []
    for r in result:
        temp = next((x for x in songs if x['title'] == r[0]), None)
        if temp:
            if r[13] == 'video':
                temp['video'].append(r[12])
            elif r[13] == 'score':
                temp['score'].append(r[12])
            elif r[13] == 'abc':
                temp['abc'] = r[15]
        else:
            songs.append({'type': 'song', 'title': r[0], 'author': r[1] if r[1] else '', 'lang': r[2] if r[2] else '', 'lang_2': r[3] if r[3] else '', 'key': r[4] if r[4] else '', 'sequence': r[5] if r[5] else '', 'bible': r[6] if r[6] else '', 'lyricist': r[7] if r[7] else '', 'book': r[8] if r[8] else '', 'copyright': r[9] if r[9] else '', 'ccli': r[10] if r[10] else '', 'lyrics_raw': r[11], 'content': Parser.parse_lyrics(r[11], r[5]), 'video': [r[12]] if r[13] == 'video' else [], 'score': [r[12]] if r[13] == 'score' else [], 'abc': r[15] if r[13] == 'abc' and r[14] else '', 'id': r[15], 'notes': '', 'transpose': ['0'], 'alt_sequence': r[5] if r[5] else ''})
    return songs

def get_song_sheet(ids=None):
    if ids:
        sql = "select (select abc from media m where m.song_id=s.song_id and m_type='abc') as abc, (select link from media m where m.song_id=s.song_id and m_type='score') as sheet, s.title from songs s where (abc is not null or sheet is not null) and s.song_id in ({ids})".format(ids=','.join(['?']*len(ids)))
        result = dB.run_para(sql, ids)
    else:
        sql = "select (select abc from media m where m.song_id=s.song_id and m_type='abc') as abc, (select link from media m where m.song_id=s.song_id and m_type='score') as sheet, s.title from songs s where (abc is not null or sheet is not null)"
        result = dB.run(sql)
    sheets = []
    for r in result:
        sheet = {'abc': '', 'sheet': '', 'title': '', 'key': ''}
        sheet['abc'] = r[0] if r[0] else ''
        if sheet['abc'] != '':
            abc = sheet['abc'].split('\r\n')
            if len(abc) < 5:
                abc = sheet['abc'].split('\n')
            abc = [x for x in abc if x.startswith('K:')][0]
            abc = abc.split(':')
            sheet['key'] = abc[1]
        sheet['sheet'] = r[1] if r[1] else ''
        sheet['title'] = r[2]
        sheets.append(sheet)
    return sheets

def get_song_chords(ids):
    sql = "select s.song_id, s.title, s.content, s.sequence, s.song_key from songs s where s.song_id in ({ids})".format(ids=','.join(['?']*len(ids)))
    result = dB.run_para(sql, ids)
    chords = []
    for r in result:
        chords.append({'id': r[0], 'title': r[1], 'content': Parser.parse_lyrics(r[2], r[3]), 'key': r[4]})
    return chords

def get_song_by_id(id):
    sql = "select s.title, s.author, s.lang, s.lang_2, s.song_key, s.sequence, s.bible_verse, s.lyricist, s.book, s.copyright, s.ccli, s.content, m.link, m.m_type, m.abc, s.song_id as id from songs s left join media m on s.song_id = m.song_id where s.song_id = ?"
    songs = dB.run_para(sql, id)
    video = []
    score = []
    abc = []
    for s in songs:
        if s[13] == 'video':
            if s[12]:
                video.append(s[12])
        elif s[13] == 'score':
            if s[12]:
                score.append(s[12])
        elif s[13] == 'abc':
            if s[14]:
                abc.append(s[14])
    if songs:
        r = songs[0]
        return {'type': 'song', 'title': r[0], 'author': r[1] if r[1] else '', 'lang': r[2] if r[2] else '', 'lang_2': r[3] if r[3] else '', 'key': r[4] if r[4] else '', 'sequence': r[5] if r[5] else '', 'bible': r[6] if r[6] else '', 'lyricist': r[7] if r[7] else '', 'book': r[8] if r[8] else '', 'copyright': r[9] if r[9] else '', 'ccli': r[10] if r[10] else '', 'lyrics_raw': r[11], 'content': Parser.parse_lyrics(r[11], r[5]), 'video': video, 'score': score, 'abc': abc, 'id': r[15], 'notes': '', 'transpose': ['0'], 'alt_sequence': r[5] if r[5] else ''}
    return None

def get_song_by_title(title):
    sql = "select song_id, title from songs where title = ?"
    result = dB.run_para(sql, title)
    return result

def duplicate_info(d1, d2):
    sql = 'insert into info(content, type, date) select d0.content, d0.type, ? from info d0 where d0.date = ? and d0.content not in (select d1.content from info d1 inner join info d2 on d1.content = d2.content where d1.date = ? and d2.date = ?)'
    return dB.run_para(sql, [d1, d2, d2, d1])

def add_info(content):
    if content["id"] != -1:
        sql = "update info set content = ?, type = ? where id = ?"
        return dB.run_para(sql, [content["info"], content["type"], content["id"]])
    else:
        sql = "insert into info(content, type, date) values(?, ?, ?)"
        id = dB.insert(sql, [content["info"], content["type"], content["date"]])
        if id:
            return str(id)
        return "Error", 400

def add_song(content):
    content = [x for x in content if x['value'] != '']
    media = [x for x in content if x['name'] in ('video', 'score', 'abc')]
    content = [x for x in content if x['name'] not in ('video', 'score', 'abc')]
    sql = "insert into songs("
    for s in content:
        sql += '{},'.format(s['name'])
    sql = sql[:-1] + ") values("
    for i in range(len(content)):
        sql += '?,'
    sql = sql[:-1] + ")"
    values = [x['value'].replace("'", "''") for x in content]
    song_id = dB.insert(sql, values)
    if not song_id:
        return None
    if len(media) > 0:
        sql = "insert into media(song_id, link, m_type) values"
        for m in media:
            sql += "(?, ?, ?),"
        sql = sql[:-1]
        values = []
        for m in media:
            values.append(song_id)
            values.append(m['value'])
            values.append(m['name'])

        result = dB.insert(sql, values)
        return song_id
    return song_id

def edit_song(id, content):
    song_set_columns = ['bible']
    media_columns = ['video', 'score', 'abc']

    # remove empty fields
    content = [x for x in content if x['value']]
    songs_columns = [x for x in content if x['name'] not in song_set_columns + media_columns]
    media_columns = [x for x in content if x['name'] in media_columns]
    song_set_columns = [x for x in content if x['name'] in song_set_columns]
    sql = "update songs set "
    values = []
    for c in songs_columns:
        sql += ' {} = ?,'.format(c["name"])
        values.append(c["value"])
    sql = sql[:-1]
    sql += ' where song_id = ?'
    if values:
        values.append(id)
        result = dB.run_para(sql, values)
    if media_columns:
        edit_media(id, media_columns)

    if songs_columns:
        edit_song_set_row(id, song_set_columns)

    return '', 200

def edit_media(id, content):
    sql = 'select * from media where m_type = ? and song_id = ?'
    for c in content:
        if dB.run_para(sql, [c["name"], id]):
            if c["name"] == 'abc':
                sql = 'update media set abc = ? where song_id = ? and m_type = ?'
            else:
                sql = 'update media set link = ? where song_id = ? and m_type = ?'
        else:
            if c["name"] == 'abc':
                sql = 'insert into media(abc, song_id, m_type) values(? ,? ,?)'
            else:
                sql = 'insert into media(link, song_id, m_type) values(? ,? ,?)'
        dB.run_para(sql, [c['value'], id, c['name']])

def edit_song_set_row(id, content):
    sql = 'select * from presentation where {} = ? and song_id = ?'
    for c in content:
        sql.format(c["name"])
        if dB.run_para(sql, [c["value"], id]):
            content.remove(c)
    if content:
        values = []
        sql = 'update presentation set '
        for c in content:
            sql += '{} = ?,'.format(c['name'])
            values.append(c['value'])
        sql = sql[:-1]
        sql += " where song_id = ?"
        values.append(id)
        dB.run_para(sql, values)

def edit_user_schedule(id, mark, date):
    worship_id = get_worship_id(date)[0]
    if mark == 0:
        r = dB.run_para('delete from instrument_team where instrument_id = -1 and user_id = ? and worship_id = ?', [int(id), int(worship_id)])
        if r:
            return r, 500
        return '', 200
    else:
        r = dB.run_para('insert into instrument_team(instrument_id, user_id, worship_id, available_date) values(-1, ?, ?, ?)', [int(id), int(worship_id), date])
        if r:
            return r, 500
        return '', 200

def edit_role(date, content, edit=None):
    """
    :param date: available_date, content: dict of column name, value
    """
    if edit:
        r = dB.run_para('update instrument_team set user_id = ? where user_id = ? and instrument_id = ? and available_date = ?', [int(content['user_id']), int(content['pre_id']), int(content['role_id']), date])
        if r:
            return r, 500
        return '', 200
    sql = "insert into instrument_team(user_id, instrument_id, available_date, worship_id) values(?, ?, ?, ?)"
    r = dB.run_para(sql, [int(content['user_id']), int(content['role_id']), date, int(content['worship_id'])])
    if r:
        return r, 500
    return '', 200

# Remove user
def remove_role(date, content):
    sql = 'DELETE from instrument_team WHERE user_id = ? and instrument_id = ? AND available_date = ?'
    r = dB.run_para(sql, [int(content['user_id']), int(content['role_id']), date])
    if r:
        return r, 500
    return '', 200

def edit_songset(id, content):
    """
    :param id: worship_id,
    :param content: dict of column name, value
    """
    if content:
        dB.run_para('delete from presentation where worship_id = ?', id)
        sql = "insert into presentation(song_id, worship_id, transpose, scheduled_date, sequence, song_order, notes, type) values"
        for song in content:
            if song['type'] == 'info':
                sql += '({}, {}, {}, "{}", "{}", {}, "{}", "{}"),'.format(-1, id, ','.join(song['transpose']), song['scheduled_date'], song['sequence'], song['song_order'], song['notes'], song['type'])
            else:
                sql += '({}, {}, {}, "{}", "{}", {}, "{}", "{}"),'.format(song['song_id'], id, ','.join(song['transpose']), song['scheduled_date'], song['sequence'], song['song_order'], song['notes'], song['type'])
        sql = sql[:-1]
        return dB.run(sql)

def update_sermon(data):
    w_date = data["date"]
    w_notes = data["notes"] if "notes" in data else None
    values = []
    sql = "update sermon set "
    for key, val in data.items():
        if key != 'notes' and key != 'date':
            sql += key + "= ?,"
            values.append(val)
    if len(values) > 0:
        values.append(w_date)
        sql = sql[:-1] + " where date = ?"
        dB.run_para(sql, values)
    if w_notes:
        sql = "update worship set notes=? where scheduled_date=?"
        dB.run_para(sql, [w_notes, w_date])

def get_worship(id):
    sql = "select notes, scheduled_date, s.title, s.speaker, s.bible_verse, s.outline from worship w inner join sermon s on w.scheduled_date = s.date where worship_id = ?"
    r = dB.run_para(sql, id)[0]
    print(r)
    return {'date': r[1], 'title': r[2] if r[2] else '', 'notes': r[0] if r[0] else '', 'speaker': r[3] if r[3] else '', 'bible': r[4] if r[4] else '', 'outline': r[5] if r[5] else ''}

def get_worship_date(id):
    sql = "select scheduled_date from worship where worship_id = ?"
    r = dB.run_para(sql, id)[0]
    return r

def get_worship_id(date):
    sql = "select worship_id from worship where scheduled_date = ?"
    r = dB.run_para(sql, date)[0]
    return r

def get_worship_songs(id):
    #sql = "select s.title, s.author, s.lang, s.lang_2, s.song_key, s.sequence, s.bible_verse, s.lyricist, s.book, s.copyright, s.ccli, s.content, (select link from media m where m.song_id=s.song_id and m_type=0) as video, (select link from media m where m.song_id=s.song_id and m_type=1) as score, w.scheduled_date as date, se.song_id as id, se.transpose as transpose, se.sequence alt_sequence, se.notes as notese from song_set se left join songs s on s.song_id = se.song_id  inner join worship w on w.scheduled_date = se.scheduled_date where se.worship_id = ? group by s.song_id order by se.song_order"
    sql = "select s.title, s.author, s.lang, s.lang_2, s.song_key, s.sequence, s.bible_verse, s.lyricist, s.book, s.copyright, s.ccli, s.content, (select link from media m where m.song_id=s.song_id and m_type='video') as video, (select link from media m where m.song_id=s.song_id and m_type='score') as score, w.scheduled_date as date, se.song_id as id, se.transpose as transpose, se.sequence alt_sequence, se.notes as notes, se.bible, se.version, se.rowid, se.type, (select abc from media m where m.song_id=s.song_id and m_type='abc') as abc from presentation se left join songs s on s.song_id = se.song_id  inner join worship w on w.scheduled_date = se.scheduled_date where se.worship_id = ? order by se.song_order"
    result = dB.run_para(sql, id)
    songs = []

    style = {'align': '', 'background': '', 'color': '', 'bgcolor': ''}
    for r in result:
        if r[22] == 'info':
            songs.append({'type': r[22], 'title': r[19] if r[19] else r[18][0:10], 'author': '', 'lang': '', 'lang_2': '', 'key': '', 'sequence': '', 'bible': '', 'lyricist': '', 'book': '', 'copyright': '', 'ccli': '', 'lyrics_raw': '', 'content': '', 'video': '', 'score': '', 'date': r[14], 'id': r[21], 'transpose': r[16].split(','), 'alt_sequence': '', 'notes': r[18] if r[18] else '', 'version': r[20] if r[20] else '', 'style': style})
        elif r[22] == 'song':
            songs.append({'type': r[22], 'title': r[0], 'author': r[1] if r[1] else '', 'lang': r[2] if r[2] else '', 'lang_2': r[3] if r[3] else '', 'key': r[4] if r[4] else '', 'sequence': r[5] if r[5] else '', 'bible': r[6] if r[6] else '', 'lyricist': r[7] if r[7] else '', 'book': r[8] if r[8] else '', 'copyright': r[9] if r[9] else '', 'ccli': r[10] if r[10] else '', 'lyrics_raw': r[11], 'content': Parser.parse_lyrics(r[11], r[17]), 'video': r[12] if r[12] else '', 'score': r[13] if r[13] else '', 'date': r[14], 'id': r[15], 'transpose': r[16].split(',') if r[16] else [0], 'alt_sequence': r[17] if r[17] else '', 'notes': r[18] if r[18] else '', 'abc': r[23] if r[23] else '', 'style': style})
    return songs

def get_availablity():
    sql = 'select it.available_date, t.user_id, t.name, t.name_2, i.id, i.name, it.worship_id from team t inner join instrument_team it on t.user_id = it.user_id inner join instrument i on i.id = it.instrument_id'
    result = dB.run(sql)
    team = []
    for r in result:
        team.append({'date': r[0] if r[0] else '', 'user_id': r[1] if r[1] else '', 'user_name': r[2] if r[2] else '', 'user_name2': r[3] if r[3] else '', 'role_id': r[4] if r[4] else '', 'role': r[5] if r[5] else '', 'worship_id': r[6] if r[6] else -1})
    return team

def worship_list(id=None):
    if id:
        sql = "select s.title, s.speaker, t.name, (select i.name from instrument i where i.id = it.instrument_id), w.title, w.scheduled_date, w.worship_id, s.bible_verse, s.outline, w.notes from worship w inner join sermon s on w.scheduled_date = s.date left join instrument_team it on w.worship_id = it.worship_id left join team t on it.user_id = t.user_id where w.worship_id=? and it.instrument_id <> -1 order by w.scheduled_date, it.instrument_id"
        result = dB.run_para(sql, id)
    else:
        sql = "select s.title, s.speaker, t.name, (select i.name from instrument i where i.id = it.instrument_id), w.title, w.scheduled_date, w.worship_id, s.bible_verse, s.outline, w.notes from worship w inner join sermon s on w.scheduled_date = s.date left join instrument_team it on w.worship_id = it.worship_id left join team t on it.user_id = t.user_id order by w.scheduled_date, it.instrument_id"
        result = dB.run(sql)
    worship = []
    for r in result:
        a = next((x for x in worship if x['date'] == r[5]), None)
        if a:
            a['content'].append({'user_name': r[2], 'role': r[3]})
        else:
            worship.append({'worship_id': r[6], 'date': r[5] if r[5] else '', 'worship_title': r[4] if r[4] else '', 'sermon_title': r[0] if r[0] else '', 'speaker': r[1] if r[1] else '', 'bible': r[7] if r[7] else '', 'outline': r[8] if r[8] else '', 'notes': r[9] if r[9] else '', 'content': [{'user_name': r[2] if r[2] else '', 'role': r[3] if r[3] else ''}]})
    return worship

def run_sql(sql):
    return dB.run(sql)
