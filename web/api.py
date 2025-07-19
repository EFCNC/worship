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

@api.route("/worship/<id>/edit", methods=["POST"])
def edit_worship(id):
    '''
    :param id: worship_id
    :return: dB result
    '''

    content = request.get_json()
    if content:
        Utils.edit_songset(int(id), content)
        result = Tools.create_json(int(id))
        return result, 200
    result = Tools.create_json(int(id))
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

@api.route("/songs/<ids>")
def list_song(ids=None):
    '''
    :param ids: song_ids in comma
    :return: return list of songs
    '''
    if ids:
        return Utils.get_songs(ids)
    songs = Utils.get_songs()
    return songs

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

@api.route("/notes", methods=["POST"])
def edit_notes():
    '''
    TODO
    :return: content of bible or None
    '''
    pass

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
    return {'team': content[0], 'inst': content[1], 'roster': content[2]}

@api.route("/roles/<date>", methods=["POST", "GET"])
def get_roles(date):
    '''
    :param date: date for matching the availability of each team
    :return: available team on provided date
    :POST: update team/role/date
    '''

    if request.method == 'POST':
        content = request.get_json()
        result = Utils.edit_role(date, [content], delete=False)
        return result
    team = Utils.list_team(date)
    return team, 200

@api.route("/roles/edit/<date>", methods=["POST"])
def edit_role(date):
    content = request.get_json()
    result = Utils.edit_role(date, content)
    return result

