import xml.etree.ElementTree as ET
import re
import json


def normalize_import_sequence(sequence, verse_count=None):
    aliases = {
        'verse': 'v', 'chorus': 'c', 'bridge': 'b',
        'p': 'pre', 'pre-chorus': 'pre', 't': 'tag',
        'i': 'in', 'intro': 'in', 'o': 'out', 'outro': 'out'
    }
    tokens = []
    for token in (sequence or '').split(','):
        token = token.strip().lower()
        if not token:
            continue
        numbered_verse = re.fullmatch(r'(\d+)', token)
        if numbered_verse:
            token = 'v' + numbered_verse.group(1)
        else:
            match = re.fullmatch(r'([a-z-]+)\s*(\d*)', token)
            if match:
                token = aliases.get(match.group(1), match.group(1)) + match.group(2)

        if verse_count == 1 and token == 'v1':
            token = 'v'
        tokens.append(token)
    return ','.join(tokens)


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


def parse_lyrics_for_slides(content, langs, sequence):
    parsed_data = json.loads(content)
    langs = langs.split(',')
    lyrics_ = []

    sequence = sequence.split(',')
    sections = {'v': 'verse', 'pre': 'prechorus', 'c': 'chorus', 'b': 'bridge', 'tag': 'tag', 'in': 'intro', 'out': 'outro', 'post': 'postchorus', 'vamp': 'vamp', 'inter': 'interlude', 'inst': 'instrumental'}
    for s in sequence:
        section = re.fullmatch(r'([a-z-]+)(\d*)', s.strip(), re.IGNORECASE)
        if not section:
            continue

        section_name = section[1].lower().replace('-', '')
        name = sections.get(section_name, section_name)
        section_number = section[2]
        i = int(section_number) - 1 if section_number else 0
        temp = {"name": '{}{}'.format(name, section_number)}

        for lang in langs:
            lang_data = next((x for x in parsed_data if x.get('lang') == lang), {})
            temp_lang = next(
                (x.get('lyrics', []) for x in lang_data.get('lyrics', [])
                 if x.get('name') == name),
                []
            )
            text = temp_lang[i] if i < len(temp_lang) else ''
            text = re.sub(r'(\[[^]]+\])', '', text) if text else ''
            temp[lang] = text if text.strip() else ''

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