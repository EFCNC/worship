from flask import Blueprint, request, send_file
from app import utils as Utils
from app import tools as Tools
import os

api = Blueprint('api', __name__, template_folder='templates')

# Worship section
@api.route("/worship/<id>/json", methods=["GET", "POST"])
def edit_worship_json(id):
    '''
    :param id: worship_id
    :return: none
    '''
    if request.method == 'GET':
        return Tools.get_worship_json(id)
    content = request.get_json()
    if content:
        result = Tools.create_json(int(id), content)
        return result, 200
    return "No Json is provided", 400

@api.route("/worship/<id>/edit", methods=["POST", "GET"])
def edit_worship(id):
    '''
    :param id: worship_id
    :return: dB result
    '''

    if request.method == 'POST':
        content = request.get_json()
        Utils.edit_songset(int(id), content)
        return '', 200
    result = Tools.create_json(int(id))
    if result == '':
        return "No song is arranged", 500
    return result, 200

@api.route("/worship/<id>/export")
def export(id):
    '''
    :param id: worship_id
    :return: return zip file name when done
    '''

    try:
        result = Tools.create_html(id)
        return result, 200
    except Exception as e:
        return e, 500

@api.route("/worship/<id>/preview")
def preview(id):
    slides = Utils.get_worship_songs(id)
    return slides

@api.route("/info/<d>")
def get_info(d):
    info = Utils.get_info(d)
    return info

@api.route("/info/edit", methods=["POST"])
def edit_info():
    info = request.get_json()
    result = Utils.add_info(info)
    return result

@api.route("/info/duplicate")
def duplicate_info():
    d1 = request.args.get('d1', None)
    d2 = request.args.get('d2', None)
    return Utils.duplicate_info(d1, d2)

@api.route("/info/delete/<id>")
def del_info(id):
    return Utils.del_info_by_id(id)

@api.route("/download")
def download():
    file = request.args.get('file', None)
    return send_file(file, as_attachment=True)

# Song section
@api.route("/song/<id>")
def get_song(id):
    '''
    :param id: song_id
    :return: return song content
    '''
    content = Utils.get_song_by_id(id)
    return content

@api.route("/songs")
@api.route("/songs/<ids>")
def list_song(ids=None):
    '''
    :param ids: song_ids in comma
    :return: return list of songs
    '''
    if ids:
        return Utils.get_songs(ids)
    else:
        songs = Utils.get_songs()
        return songs[:5]

@api.route("/songs/ranking/<days>/<yes>")
@api.route("/songs/ranking/<days>")
def get_song_ranking(days, yes=None):
    '''
    :param days: ranking within days
    :return: return list of songs
    '''
    content = Utils.get_songs_para(days, yes)
    return content

@api.route("/song/<id>/edit", methods=["POST"])
def edit_song(id):
    '''
    :param id: song_id
    :return: 200 when song is updated successfully. error message with 500
    :POST: content of edited song
    '''

    song = request.get_json()
    result = Utils.edit_song(id, song)
    return result

@api.route("/song/add", methods=["POST"])
def add_song():
    '''
    :param song: Form data of song content
    :return: 400 when title already in current dB
    '''

    song = request.get_json()
    title = next((x['value'] for x in song if x['name'] == 'title'), None)
    result = Utils.get_song_by_title(title)
    if result:
        return "{} already exist".format(title), 400
    song_id = Utils.add_song(song)
    if song_id:
        return str(song_id), 200
    return "Unknown Error!!", 500

@api.route("/search/song")
def search_song():
    '''
    :param keywords: search keywords
    :return: dict with matched song results. left=songs from imported dB, right=songs from current dB
    '''

    keywords = request.args.get('keywords', None)
    if keywords is None:
        return {"No keyword provided!"}, 400
    right = Utils.search_song_efcnc(keywords)
    left = Utils.search_songs(keywords)
    # remove title from left if it's already in current dB
    left = [x for x in left if not any(y for y in right if y['title'] == x['title'])]
    return {'left': left, 'right': right}, 200

@api.route("/backgrounds")
def list_bg():
    bg_files = Tools.get_background_files()
    return bg_files

@api.route("/sermon/<id>", methods=["GET", "POST"])
def edit_sermon(id):
    '''
    :id: worship id
    '''
    if request.method == 'POST':
        sermon_data = request.get_json()
        Utils.update_sermon(sermon_data)
        return "good"
    sermon = Utils.get_worship(id)
    return sermon

# BibleAPI section
@api.route("/bible/books")
def list_book():
    '''
    :return: bible books
    '''

    result = Utils.bible_book()
    return result

@api.route("/search/bible")
def search_bible():
    '''
    :param keywords: search keywords
    :param page: pagination
    :param range: search range (OT, NT)
    :return: bible verses in dict list
    '''

    keywords = request.args.get('keywords', None)
    page = request.args.get('page', 0)
    range = request.args.get('range', None)
    page = int(page)*10
    result = Utils.search_bible(keywords, page, range)
    if result[1] != 200:
        return result
    verses = result[0]["data"]["verses"]
    return verses

# Team section
@api.route("/inst_team/<id>")
def arrange_team(id):
    '''
    :param id: worship_id
    :return: available team member, role, and current roster
    '''

    content = Utils.get_worship_teams(id)
    return {'team': content[0], 'inst': content[1], 'roster': content[2], 'marked': content[3]}

@api.route("/roles/<dd>", methods=["POST", "PUT"])
def edit_roles(dd):
    '''
    :param date: date for matching the availability of each team
    :return: available team on provided date
    :POST: update team/role/date
    '''

    if request.method == 'POST':
        content = request.get_json()
        if 'pre_id' in content and content['pre_id'] == 0:
            content['worship_id'] = Utils.get_worship_id(dd)[0]
        return Utils.edit_role(dd, content)
    elif request.method == 'PUT':
        content = request.get_json()
        return Utils.edit_role(dd, content, True)

@api.route("/roles/user/<id>", methods=["GET"])
def mark_user(id):
    '''
    :param id: user id
    :param mark: 1=unavailable, 0=available
    :param date: worship date
    :return: nothing, if error return 500
    '''
    mark = request.args.get('mark', 0)
    date = request.args.get('date', None)
    result = Utils.edit_user_schedule(int(id), int(mark), date)
    return result
