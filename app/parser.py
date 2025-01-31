import xml.etree.ElementTree as ET
import re

def parse_lyrics_for_import(content):
    try:
        tree = ET.fromstring(content)
        lyrics = []
        verses = tree.findall('./lyrics/verse')
        #verses = sorted(verses, key=lambda d: (d.attrib['type'], d.attrib['label']))
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
    #lyrics = re.findall('<(\w+)>([^<]+)<\/\w+>', content)
    lyrics = re.findall('<([0-9a-zA-Z\-]+)>([^<]+)<\/[0-9a-zA-Z\-]+>', content)
    for l in lyrics:
        c = re.sub('\\n', '<br>', l[1])
        region = re.search('\[region 2\](.+)', c, flags=re.IGNORECASE)
        cc = re.sub('\[region 2\].+', '', c, flags=re.IGNORECASE)
        s = l[0]
        if re.match('.+\d', s):
            s = s[0]+s[-1]
        else:
            s = s[0]
        lyrics_.append({'name': s, 'origin': cc, 'region': region[1] if region else '',
                        'origin_text': re.sub('(\[[^]]+\])', '', cc),
                        'region_text': re.sub('(\[[^]]+\])', '', region[0]) if region else '',
                        'origin_chord': parse_chord(cc)})
    sequence = sequence.split(',')
    sequence = [next((y for y in lyrics_ if y['name'].lower() == x.lower()), '') for x in sequence]
    return sequence

def parse_chord(content):
    chords = re.sub(r'\[([^]]+)\](\s?\w+)?\s?', '<div class="chord-letter"><span class="chord">\\1</span>\\2</div>', content)
    # inline approach
    #chords = re.sub(r'\[([^]]+)\](\s?\w+)?\s?', '<span class="chord"><span class="inline">\\1</span></span>\\2', content)
    # chunk approach
    #chords = re.sub(r'\[([^]]+)\](\s?\w+)?\s?', '<div class="chunk"><span class="chord">\\1</span><span class="lyric">\\2</span>', content)
    return chords
