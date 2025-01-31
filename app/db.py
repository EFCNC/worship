import pyodbc
import sqlite3
import os

con = None
db_name = "worship.db"

def search(query):
    db = query["name"]
    sql = query["sql"]
    cols = query["cols"]
    keywords = query["keywords"]
    match = query["match"]
    result = query["result"]
    cols = ['{} {} ?'.format(x, match) for x in cols]
    if match == 'like':
        keywords = ['%{}%'.format(x) for x in keywords]
    temp = []
    params = keywords * len(cols)
    for col in cols:
        temp.append([col] * len(keywords))
    condition = 'or'    #
    temp = ['({})'.format(' {} '.join(x).format(condition)) for x in temp]
    sql = sql.format(' {} '.join(temp).format(result))
    return run_para(sql, params, db)

def get_song(query):
    db = query["name"]
    sql = query["sql"]
    id = query["id"]
    return run_para(sql, id, db)

def run(sql, db_name="worship.db"):
    return __execute(sql, para=None, db_name=db_name)

def run_para(sql, para, db_name="worship.db"):
    if type(para) is not list:
        para = [para]
    return __execute(sql, para=para, db_name=db_name)

def insert(sql, para, db_name="worship.db"):
    if type(para) is not list:
        para = [para]
    try:
        con = open(db_name)
        cur = con.cursor()
        cur.execute(sql, para)
        song_id = cur.lastrowid
        print(song_id)
        con.commit()
        return song_id, 200
    except Exception as e:
        print("error", e)
        return e, 500
    finally:
        con.close()

def __execute(sql, db_name, para=None):
    try:
        con = open(db_name)
        cur = con.cursor()
        if para:
            result = cur.execute(sql, para).fetchall()
        else:
            result = cur.execute(sql).fetchall()
        con.commit()
        return result
    except Exception as e:
        print('error', e)
        return e
    finally:
        close()

def open(db_name):
    con = _connect_db(db_name)
    return con

def close():
    try:
        con.close()
        return None
    except Exception as e:
        return e

def _connect_db(db_name):
    path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    con = sqlite3.connect(os.path.join(path, 'db', db_name))
    return con