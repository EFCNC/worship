from app import utils as Utils
import re
import os
from datetime import date, timedelta, datetime
from zipfile import ZipFile
import json

conf = Utils.conf

def edit_worship_json(id, content, pos):
    '''

    :param id: worship id
    :param content: content that's going to be added to the slides object
    :param pos: current position of slide
    :return: updated json
    '''

    json = get_worship_json(id)
    type = content[0]
    if type == 0:
        json.push(content[1])
    elif type == 1:
        json.insert(pos, content[1])
    return json

def get_background_files(name=None):
    if not name:
        dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
        bg_path = os.path.join(dir_path, 'web', 'static', 'presentation', 'bg')
        bg = []
        if os.path.exists(bg_path):
            bg = os.listdir(bg_path)
            bg = ['../static/presentation/bg/{}'.format(x) for x in bg]
        return bg

def get_worship_json(id):
    w = Utils.get_worship(id)
    json_file = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'files', 'json', '{}_{}.json'.format(w['date'], id))
    if not os.path.exists(json_file):
        return None
    with open(json_file, 'r', encoding='utf8') as f:
        slides = json.load(f)
    return slides

def list_worship_file():
    path = conf["worship"]["path"]
    files = os.listdir(path)
    return [{'filename': x.split('.')[0].split('_')[0], 'id': x.split('.')[0].split('_')[1]} for x in files if os.path.isfile(os.path.join(path, x))]

def create_json(id):
    worship = Utils.get_worship_songs(id)
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'files', 'json')
    if not worship:
        return None

    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

    with open(os.path.join(path, '{}_{}.json'.format(worship[0]["date"], id)), "w", encoding="utf-8") as f:
        json.dump(worship, f, ensure_ascii=False)

def create_xml(worship):
    theme = '<?xml version="1.0" encoding="utf-8"?>\n<Easyslides>\n<ListItem>\n<ListHeader>\n<FormatData>\n'
    theme += conf["easyslides"]["templates"]["theme"][0]
    theme += "</FormatData>\n<Notes />\n</ListHeader>\n"
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'files', 'xml', worship[0]["date"])
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
    itemNo = 1
    for w in worship:
        filename = re.sub('(:|,)', '', w['title'])
        song_list = "<Item>\n<ItemID>IE;{}.esi</ItemID>\n<Title1>{}</Title1>\n<Folder/>\n<FormatData></FormatData>\n</Item>\n".format(filename, w["title"])
        song_theme = '<?xml version="1.0" encoding="utf-8"?>\n<Easyslides>\n<Item>\n<Type>I</Type>'
        song_theme += "<Title1>" + w["title"] + "</Title1>\n"
        if w["type"] == "s":
            song_theme += "<CurItemNo>" + str(itemNo) +"</CurItemNo>\n<Contents>"
            for lyrics in w["content"]:
                song_theme += "\n[{}]\n{}".format(lyrics["name"], lyrics["origin"].replace('<br>', '\n'))
                if lyrics["region"] != "":
                    song_theme += "\n[region 2]\n{}".format(lyrics["region"].replace('<br>', '\n'))
            song_theme += "\n</Contents>\n<Sequence>" + w["sequence"] + "</Sequence>\n"
        elif w["type"] == "i":
            song_theme += "<BibleReference>B0;ASV;;48;3;8;3;8;" + "</BibleReference>"
            song_theme += "<CurItemNo>" + str(itemNo) + "</CurItemNo>\n<Contents>[1]" + w["notes"] + "</Contents>"
            song_theme += "<Copyright>" + w["version"] + "</Copyright>"
        song_theme += conf["easyslides"]["templates"]["song"][0]
        song_theme = re.sub('(\n)+', '\n', song_theme)
        itemNo += 1
        with open(os.path.join(path, '{}.esi'.format(filename)), "w", encoding="utf_8_sig") as f:
            f.write(song_theme)
            theme += song_list
    theme += "</ListItem>\n</Easyslides>"
    theme = re.sub(r'(\n)+', r'\n', theme)
    with open(os.path.join(path, '{}.esw'.format(worship[0]["date"])), "w", encoding="utf_8_sig") as f:
        f.write(theme)

    return zip_file(path)

def zip_file(path):
    root = os.path.basename(path)
    zip_file_name = os.path.join(os.path.dirname(path), '{}.zip'.format(os.path.basename(path)))
    try:
        with ZipFile(zip_file_name, 'w') as zipObj:
            for folderName, subfolders, filenames in os.walk(path):
                for filename in filenames:
                    filepath = os.path.join(folderName, filename)
                    zipObj.write(filepath, arcname=os.path.join(root, filename))
    except Exception as e:
        print(e)
    return zip_file_name

def allsundays():
    now = datetime.now()
    coming_sunday = (now + timedelta(days=6-now.weekday())).strftime("%Y-%m-%d")
    year = now.year
    d = date(year, 1, 1)
    d += timedelta(days = 6 - d.weekday())  # First Sunday
    sundays = []
    sundays.append(d.strftime("%Y-%m-%d"))
    while d.year == year:
        d += timedelta(days = 7)
        if d.year == year:
            sundays.append(d.strftime("%Y-%m-%d"))

    # return the coming sunday as well as all sundays
    return [coming_sunday, sundays]

def match_bible_books(book):
    '''
    :param book: book name as full name or short name
    :return: book index for easyslide, None if not found
    '''

    full_name = ['', 'GENESIS', 'EXODUS', 'LEVITICUS', 'NUMBERS', 'DEUTERONOMY', 'JOSHUA', 'JUDGES', 'RUTH', '1 SAMUEL', '2 SAMUEL', '1 KINGS', '2 KINGS', '1 CHRONICLES', '2 CHRONICLES', 'EZRA', 'NEHEMIAH', 'ESTHER', 'JOB', 'PSALMS', 'PROVERBS', 'ECCLESIASTES', 'SONG OF SOLOMON', 'ISAIAH', 'JEREMIAH', 'LAMENTATIONS', 'EZEKIEL', 'DANIEL', 'HOSEA', 'JOEL', 'AMOS', 'OBADIAH', 'JONAH', 'MICAH', 'NAHUM', 'HABAKKUK', 'ZEPHANIAH', 'HAGGAI', 'ZECHARIAH', 'MALACHI', 'MATTHEW', 'MARK', 'LUKE', 'JOHN', 'ACTS', 'ROMANS', '1 CORINTHIANS', '2 CORINTHIANS', 'GALATIANS', 'EPHESIANS', 'PHILIPPIANS', 'COLOSSIANS', '1 THESSALONIANS', '2 THESSALONIANS', '1 TIMOTHY', '2 TIMOTHY', 'TITUS', 'PHILEMON', 'HEBREWS', 'JAMES', '1 PETER', '2 PETER', '1 JOHN', '2 JOHN', '3 JOHN', 'JUDE', 'REVELATION']
    short_name = ['', 'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV']
    if book.upper() not in full_name:
        if book.upper() not in short_name:
            return None
        else:
            return short_name.index(book.upper())
    else:
        return full_name.index((book.upper()))
