import xml.etree.ElementTree as ET
import re
import json

def parse_lyrics_for_import(content):
    try:
        tree = ET.fromstring(content)
        lyrics = []
        verses = tree.findall('./lyrics/verse')
        converted = ''
        sequence = []
        for verse in verses:
            lyrics = verse.text
            if verse.attrib["type"] == 'c':
                sequence.append('c')
                converted += "<chorus>\n{}\n</chorus>\n".format(lyrics)
            elif verse.attrib["type"] == 'b':
                sequence.append('b')
                converted += "<bridge>\n{}\n</bridge>\n".format(lyrics)
            else:
                sequence.append(verse.attrib['label'])
                converted += "<{}>\n{}\n</{}>\n".format(verse.attrib['label'], lyrics, verse.attrib['label'])
        return [converted, ','.join(sequence)]
    except Exception as e:
        print(e)
        return [content, '']


def parse_lyrics1(content, langs, sequence):
    parsed_data = json.loads(content)
    langs = langs.split(',')
    lyrics_ = []

    sequence = sequence.split(',')
    sections = {'v': 'verse', 'p': 'pre-chorus', 'c': 'chorus', 'b': 'bridge', 't': 'tag', 'i': 'intro', 'o': 'outro', 'f': 'finish'}
    for s in sequence:
        section = re.findall('(\w)(\d)?', s)
        # Find sequence name and order
        if section[0]:
            temp = {}
            name = section[0][0]
            i = int(section[0][1])-1 if section[0][1] else 0
            # Add section based on name and order by language
            temp["name"] = '{}{}'.format(sections[name], section[0][1])
            for lang in langs:
                temp_lang = next(x['lyrics'] for x in parsed_data if x['lang'] == lang)
                temp_lang = next((x['lyrics'] for x in temp_lang if x['name'] == sections[name]), None)
                temp[lang] = re.sub(r'(\[[^]]+\])', '', temp_lang[i]) if i < len(temp_lang) else ''
        lyrics_.append(temp)

    return lyrics_

def parse_lyrics(content, sequence):
    parsed_data = json.loads(content)
    lyrics_ = []

    for lang_block in parsed_data:
        processed_sections = []

        for section in lang_block.get('lyrics', []):
            lines = [re.sub(r'(^\n)|(\n$)', '', x) for x in section.get('lyrics', [])]
            
            processed_sections.append({
                "name": section.get("name", ""),
                "lyrics": lines,
                "lyrics_text": [re.sub(r'(\[[^]]+\])', '', x) for x in lines],
                "lyrics_chord": parse_chord(lines)
            })
            
        lyrics_.append({
            "lang": lang_block.get('lang', ''),
            "version": lang_block.get('version', ''),
            "title": lang_block.get('title', ''),
            "lyrics": processed_sections
        })


    return lyrics_

def parse_chord(content):
    # chunk approach
    chords_ = []
    for c in content:
        chords = re.sub(r'\[([^]]+)\](\s?\w+)?(\s?)', '<span class="chunk" data-chord="\\1">\\2</span>\\3', c)
        chords = re.sub('">([^<]*)<\/span>', add_space, chords)
        chords_.append(chords)
    return chords_

def add_space(obj):
    l = len(obj[1])
    if l < 2:
        return obj[0]+"&nbsp;&nbsp;"*(2-l)
    return obj[0]