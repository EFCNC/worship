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

def parse_lyrics(content, sequence):

    lyrics_ = []
    lyrics = json.loads(content)
    sections = ['verse', 'pre-chorus', 'chorus', 'bridge', 'tag', 'vamp', 'intro', 'outro', 'finish']
    for name in sections:
        if name in lyrics['origin']:
            origin = [re.sub('\r?\n', '<br/>', x) for x in lyrics['origin'][name]]
            region = ''
            if lyrics['region']:
                region = [re.sub('\r?\n', '<br/>', x) for x in lyrics['region'][0][name]]
            temp = dict(name=name, origin=origin, region=region, origin_text=[re.sub('(\[[^]]+\])', '', x) for x in origin], origin_chord=parse_chord(origin), region_text=[re.sub('(\[[^]]+\])', '', x) for x in region])
            lyrics_.append(temp)
    #sequence = sequence.split(',')
    #sequence = [next((y for y in lyrics_ if y['name'].lower() == x.lower()), '') for x in sequence]
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