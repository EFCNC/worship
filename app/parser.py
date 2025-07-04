import xml.etree.ElementTree as ET
import re

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
    lyrics = re.findall('<([0-9a-zA-Z\-]+)>([^<]+)<\/[0-9a-zA-Z\-]+>', content)
    for l in lyrics:
        c = re.sub('\r?\n', '<br/>', l[1])
        origin = re.sub('\[region 2\].+', '', c, flags=re.IGNORECASE)
        origin = re.sub('(^<br\/?>)|(<br\/?>$)', '', origin)
        region = None
        if re.search('.+\[region 2\]', c, flags=re.IGNORECASE):
            region = re.sub('.+\[region 2\]', '', c, flags=re.IGNORECASE)
            region = re.sub('(^<br\/?>)|(<br\/?>$)', '', region)
        s = l[0]
        if re.match('.+\d', s):
            s = s[0]+s[-1]
        else:
            s = s[0]
        lyrics_.append({'name': s, 'origin': origin, 'region': region if region else '',
                        'origin_text': re.sub('(\[[^]]+\])', '', origin),
                        'region_text': re.sub('(\[[^]]+\])', '', region) if region else '',
                        'origin_chord': parse_chord(origin)})
    sequence = sequence.split(',')
    sequence = [next((y for y in lyrics_ if y['name'].lower() == x.lower()), '') for x in sequence]
    return sequence

def parse_chord(content):
    # chunk approach
    chords = re.sub(r'\[([^]]+)\](\s?\w+)?(\s?)', '<span class="chunk" data-chord="\\1">\\2</span>\\3', content)
    chords = re.sub('">([^<]*)<\/span>', add_space, chords)
    return chords

def add_space(obj):
    l = len(obj[1])
    if l < 2:
        return obj[0]+"&nbsp;&nbsp;"*(2-l)
    return obj[0]