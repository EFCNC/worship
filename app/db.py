import sqlite3
import os
import re

con = None
db_name = "worship.db"

def search(query):
    db = query["name"]
    sql = query["sql"]
    cols = query.get("cols", [])
    keywords = query.get("keywords", [])
    match = query.get("match", "like")
    result_op = query.get("result", "or").upper()

    if not cols or not keywords:
        return []

    keywords = [str(k).strip() for k in keywords if str(k).strip()]
    if not keywords:
        return []

    where_clauses = []
    params = []

    for col in cols:
        col_conditions = []
        for kw in keywords:
            if match == 'like':
                col_conditions.append(f"{col} LIKE ?")
                params.append(f"%{kw}%")
            else:
                col_conditions.append(f"{col} = ?")
                params.append(kw)
            
        if col_conditions:
            col_sql = f"({f' {result_op} '.join(col_conditions)})"
            where_clauses.append(col_sql)

    if not where_clauses:
        return []

    where_sql = " OR ".join(where_clauses)
    final_sql = sql.format(where_sql)

    # Execute query
    res = run_para(final_sql, params, db)

    # Safely handle SQLite errors
    if isinstance(res, Exception):
        print(f"[DB Search Error in {db}]: {res}")
        return []

    return res if res else []

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
        con.commit()
        return song_id
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