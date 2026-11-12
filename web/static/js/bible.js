let book_names;
// Simplified dictionary: We only need Chinese now, the ESV API handles English natively
let book_name = [
    { "id": "GEN", "name": "創世記", "s_name": "創" },
    { "id": "EXO", "name": "出埃及記", "s_name": "出" },
    { "id": "LEV", "name": "利未記", "s_name": "利" },
    { "id": "NUM", "name": "民數記", "s_name": "民" },
    { "id": "DEU", "name": "申命記", "s_name": "申" },
    { "id": "JOS", "name": "約書亞記", "s_name": "書" },
    { "id": "JDG", "name": "士師記", "s_name": "士" },
    { "id": "RUT", "name": "路得記", "s_name": "得" },
    { "id": "1SA", "name": "撒母耳記上", "s_name": "撒上" },
    { "id": "2SA", "name": "撒母耳記下", "s_name": "撒下" },
    { "id": "1KI", "name": "列王紀上", "s_name": "王上" },
    { "id": "2KI", "name": "列王紀下", "s_name": "王下" },
    { "id": "1CH", "name": "歷代志上", "s_name": "代上" },
    { "id": "2CH", "name": "歷代志下", "s_name": "代下" },
    { "id": "EZR", "name": "以斯拉記", "s_name": "拉" },
    { "id": "NEH", "name": "尼希米記", "s_name": "尼" },
    { "id": "EST", "name": "以斯帖記", "s_name": "斯" },
    { "id": "JOB", "name": "約伯記", "s_name": "伯" },
    { "id": "PSA", "name": "詩篇", "s_name": "詩" },
    { "id": "PRO", "name": "箴言", "s_name": "箴" },
    { "id": "ECC", "name": "傳道書", "s_name": "傳" },
    { "id": "SNG", "name": "雅歌", "s_name": "歌" },
    { "id": "ISA", "name": "以賽亞書", "s_name": "賽" },
    { "id": "JER", "name": "耶利米書", "s_name": "耶" },
    { "id": "LAM", "name": "耶利米哀歌", "s_name": "哀" },
    { "id": "EZK", "name": "以西結書", "s_name": "結" },
    { "id": "DAN", "name": "但以理書", "s_name": "但" },
    { "id": "HOS", "name": "何西阿書", "s_name": "何" },
    { "id": "JOL", "name": "約珥書", "s_name": "珥" },
    { "id": "AMO", "name": "阿摩司書", "s_name": "摩" },
    { "id": "OBA", "name": "俄巴底亞書", "s_name": "俄" },
    { "id": "JON", "name": "約拿書", "s_name": "拿" },
    { "id": "MIC", "name": "彌迦書", "s_name": "彌" },
    { "id": "NAM", "name": "那鴻書", "s_name": "鴻" },
    { "id": "HAB", "name": "哈巴谷書", "s_name": "哈" },
    { "id": "ZEP", "name": "西番雅書", "s_name": "番" },
    { "id": "HAG", "name": "哈該書", "s_name": "該" },
    { "id": "ZEC", "name": "撒迦利亞書", "s_name": "亞" },
    { "id": "MAL", "name": "瑪拉基書", "s_name": "瑪" },
    { "id": "MAT", "name": "馬太福音", "s_name": "太" },
    { "id": "MRK", "name": "馬可福音", "s_name": "可" },
    { "id": "LUK", "name": "路加福音", "s_name": "路" },
    { "id": "JHN", "name": "約翰福音", "s_name": "約" },
    { "id": "ACT", "name": "使徒行傳", "s_name": "徒" },
    { "id": "ROM", "name": "羅馬書", "s_name": "羅" },
    { "id": "1CO", "name": "哥林多前書", "s_name": "林前" },
    { "id": "2CO", "name": "哥林多後書", "s_name": "林後" },
    { "id": "GAL", "name": "加拉太書", "s_name": "加" },
    { "id": "EPH", "name": "以弗所書", "s_name": "弗" },
    { "id": "PHP", "name": "腓立比書", "s_name": "腓" },
    { "id": "COL", "name": "歌羅西書", "s_name": "西" },
    { "id": "1TH", "name": "帖撒羅尼迦前書", "s_name": "帖前" },
    { "id": "2TH", "name": "帖撒羅尼迦後書", "s_name": "帖後" },
    { "id": "1TI", "name": "提摩太前書", "s_name": "提前" },
    { "id": "2TI", "name": "提摩太後書", "s_name": "提後" },
    { "id": "TIT", "name": "提多書", "s_name": "多" },
    { "id": "PHM", "name": "腓利門書", "s_name": "門" },
    { "id": "HEB", "name": "希伯來書", "s_name": "來" },
    { "id": "JAS", "name": "雅各書", "s_name": "雅" },
    { "id": "1PE", "name": "彼得前書", "s_name": "彼前" },
    { "id": "2PE", "name": "彼得後書", "s_name": "彼後" },
    { "id": "1JN", "name": "約翰一書", "s_name": "約一" },
    { "id": "2JN", "name": "約翰二書", "s_name": "約二" },
    { "id": "3JN", "name": "約翰三書", "s_name": "約三" },
    { "id": "JUD", "name": "猶大書", "s_name": "猶" },
    { "id": "REV", "name": "啟示錄", "s_name": "啟" }
];

function fetch_books() {
    fetch(`https://bible.helloao.org/api/cmn_cuv/books.json`)
        .then(request => request.json())
        .then(books => {
            book_names = books;
        });
}

function extractText(node) {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && typeof node === 'object') {
        if (node.text) return node.text;
        if (node.content) return extractText(node.content);
        if (node.items) return extractText(node.items);
    }
    return '';
}

function show_verse(title, htmlContent) {
    // Check if the screen is mobile-sized
    const isMobile = $(window).width() < 600;

    $("#dialog").html(htmlContent);
    $("#dialog").dialog({
        title: title,
        width: isMobile ? '95%' : 500, 
        maxWidth: isMobile ? 'none' : $(window).width() * 0.9,
        maxHeight: 500, 
        position: { my: "center", at: "center", of: window },
        buttons: [
            {
                id: "button-ok",
                text: "OK",
                click: function() {
                    $(this).dialog("close");
                }
            }
        ]
    });
}

async function get_bible(callback, name) {
    // Check if the query contains English letters
    var isEnglish = /[a-zA-Z]/.test(name);
    if (isEnglish) {
        get_english_bible(name, callback);
    } else {
        get_chinese_bible(name, callback);
    }
}

function get_english_bible(name, callback){
    var esvQuery = name;

    // If no numbers are provided, default to Chapter 1
    if (!/\d/.test(esvQuery)) {
        esvQuery += " 1"; 
    }

    var url = `https://api.esv.org/v3/passage/html/?q=${encodeURIComponent(esvQuery)}&include-passage-references=false&include-footnotes=false&include-short-copyright=false&include-audio-link=false&include-headings=true`;
    
    fetch(url, {
        headers: { 'Authorization': `Token ${ESV_API_KEY}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.passages && data.passages.length > 0) {
            var displayTitle = data.canonical;
            if (!/\d/.test(name)) displayTitle += " (Preview)"; 
            displayTitle += " (ESV)"; 

            // Join all passages in the array together, separated by a line break
            var allVersesHtml = data.passages.join('<br/>');
            
            callback(displayTitle, allVersesHtml);
        } else {
            callback(name, "Verses not found.");
        }
    })
    .catch(err => console.error("ESV API Error:", err));
}

function get_chinese_bible(name, callback){
    var match = name.match(/^(\d?\s*[\u4e00-\u9fa5]+)\s*(?:(\d+)(?:[:：]\s*(.*))?)?$/);
    if (!match) {
        console.error("Could not parse bible reference:", name);
        return;
    }

    var b_name_raw = match[1].trim();
    var ch = match[2] || "1";
    var verseStr = match[3] || "";

    var ver = [];
    if (verseStr) {
        var parts = verseStr.split(',');
        for (var k = 0; k < parts.length; k++) {
            var t = parts[k].split('-');
            if (t.length > 1) {
                for (var n = parseInt(t[0]); n <= parseInt(t[1]); n++) {
                    ver.push(n.toString());
                }
            } else {
                ver.push(t[0].trim());
            }
        }
    }

    var bookObj = book_name.find(obj => obj.name === b_name_raw || obj.s_name === b_name_raw);
    if (!bookObj) return;

    var displayTitle = bookObj.name;
    if (match[2]) displayTitle += ' ' + ch;
    if (verseStr) displayTitle += ':' + verseStr;
    
    var url = 'https://bible.helloao.org/api/cmn_cuv/' + bookObj.id + '/' + ch + '.json';

    fetch(url)
        .then(request => request.json())
        .then(chapter => {
            let htmlOutput = [];
            let previewing = false;

            let versesToParse = [];
            if (ver.length === 0) {
                // If no verses are specified, map the entire chapter (including headings)
                versesToParse = chapter.chapter.content.map(v => [v]);
                previewing = true;
            } else {
                for (var i = 0; i < ver.length; i++) {
                    versesToParse.push(chapter.chapter.content.filter(obj => {
                        if (!obj.number) return false;
                        var apiNums = obj.number.toString().split('-');
                        if (apiNums.length > 1) {
                            return parseInt(ver[i]) >= parseInt(apiNums[0]) && parseInt(ver[i]) <= parseInt(apiNums[1]);
                        }
                        return obj.number == ver[i];
                    }));
                }
            }

            // Format the HTML for HelloAO
            for (let matches of versesToParse) {
                if (!matches || matches.length === 0) continue; 
                let temp = matches[0]; 
                let text = extractText(temp).trim();
                if (!text && !temp.number) continue;

                if (temp.type === "heading") {
                    htmlOutput.push('<br/><strong>' + text + '</strong>');
                } else {
                    let prefix = temp.number ? '<strong>' + temp.number + '</strong> ' : '';
                    htmlOutput.push(prefix + text);
                }
            }

            if (previewing) displayTitle += " (Preview)";
            
            callback(displayTitle, htmlOutput.join('<br/><br/>'));
        })
        .catch(err => console.error("HelloAO API Error:", err));
}

/* ==========================================================================
   Structured lookups — used by the admin "Bible slide" builder

   get_bible() above shows a dialog with formatted HTML. The functions below
   return per-verse data in BOTH languages instead, and reject with an Error
   whose message is safe to show to the user.

     lookup_bilingual_passage('John 3:16-17')      // or '約翰福音 3:16-17'
       -> Promise<{ title: { zh, en }, chapter, verses: [{ number, zh, en }] }>

   Limits: one chapter per lookup (no "John 3:16-4:2").
   Needs:  fetch, DOMParser, and the global ESV_API_KEY (same as get_english_bible).
   ========================================================================== */

var BIBLE_MAX_VERSES = 176;   // longest chapter (Psalm 119); guards against "1-99999"

// English book names, same order as book_name. Used to build ESV queries from Chinese input.
(function () {
    var english = [
        'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
        '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
        'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
        'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
        'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
        'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
        'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
        'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];
    book_name.forEach(function (book, index) {
        book.en = english[index];
    });
}());

function bible_fetch(url, options, serviceName) {
    return fetch(url, options).catch(function () {
        throw new Error('Could not reach the ' + serviceName + ' service. Check your connection.');
    }).then(function (response) {
        if (!response.ok) {
            throw new Error(serviceName + ' request failed (' + response.status + ').');
        }
        return response.json();
    });
}

// "16-17,19" -> [16, 17, 19]
function parse_verse_list(text) {
    var seen = {};
    var list = [];
    text.split(/[,，]/).forEach(function (part) {
        part = part.trim();
        if (!part) {
            return;
        }
        var match = part.match(/^(\d+)\s*(?:[-–—]\s*(\d+))?$/);
        if (!match) {
            throw new Error('Could not read the verses "' + part + '".');
        }
        var from = parseInt(match[1], 10);
        var to = match[2] ? parseInt(match[2], 10) : from;
        if (to < from || to - from >= BIBLE_MAX_VERSES) {
            throw new Error('Invalid verse range "' + part + '".');
        }
        for (var n = from; n <= to; n++) {
            if (!seen[n]) {
                seen[n] = true;
                list.push(n);
            }
        }
    });
    return list.sort(function (a, b) { return a - b; });
}

// [16, 17, 19] -> "16-17,19"
function format_verse_ranges(numbers) {
    var parts = [];
    var start = null;
    var previous = null;
    function close() {
        parts.push(start === previous ? String(start) : start + '-' + previous);
    }
    numbers.forEach(function (n) {
        if (start === null) {
            start = previous = n;
        }
        else if (n === previous + 1) {
            previous = n;
        }
        else {
            close();
            start = previous = n;
        }
    });
    if (start !== null) {
        close();
    }
    return parts.join(',');
}

// Same grammar as get_chinese_bible(): 約翰福音 3:16-17,19  /  約 3  /  約翰福音
// -> { book, chapter, verses: [ints] | null (whole chapter) }
function parse_chinese_reference(input) {
    var match = input.trim().match(/^(\d?\s*[\u4e00-\u9fa5]+)\s*(?:(\d+)(?:[:：]\s*(.*))?)?$/);
    if (!match) {
        throw new Error('Could not read that reference. Try 約翰福音 3:16-17 or John 3:16-17.');
    }
    var bookText = match[1].trim();
    var book = book_name.find(function (obj) {
        return obj.name === bookText || obj.s_name === bookText;
    });
    if (!book) {
        throw new Error('Unknown book "' + bookText + '".');
    }
    var verses = match[3] && match[3].trim() ? parse_verse_list(match[3]) : null;
    return { book: book, chapter: parseInt(match[2] || '1', 10), verses: verses && verses.length ? verses : null };
}

function esv_query_for(ref) {
    return ref.book.en + ' ' + ref.chapter + (ref.verses ? ':' + format_verse_ranges(ref.verses) : '');
}

// ESV "parsed" ranges are BBCCCVVV integers, e.g. John 3:16 = 43003016. Book number = index in book_name + 1.
function decode_esv_verse(id) {
    return { book: Math.floor(id / 1000000), chapter: Math.floor(id / 1000) % 1000, verse: id % 1000 };
}

function reference_from_esv(data) {
    if (!data.parsed || !data.parsed.length) {
        throw new Error('Could not read that reference.');
    }
    var bookNumber = null;
    var chapter = null;
    var seen = {};
    var verses = [];
    data.parsed.forEach(function (range) {
        var from = decode_esv_verse(range[0]);
        var to = decode_esv_verse(range[1]);
        var sameChapter = from.book === to.book && from.chapter === to.chapter &&
            (bookNumber === null || (bookNumber === from.book && chapter === from.chapter));
        if (!sameChapter) {
            throw new Error('Please choose verses from a single chapter.');
        }
        bookNumber = from.book;
        chapter = from.chapter;
        for (var n = from.verse; n <= to.verse; n++) {
            if (!seen[n]) {
                seen[n] = true;
                verses.push(n);
            }
        }
    });
    var book = book_name[bookNumber - 1];
    if (!book) {
        throw new Error('Could not read that reference.');
    }
    return { book: book, chapter: chapter, verses: verses.sort(function (a, b) { return a - b; }) };
}

// ESV passage HTML -> { verseNumber: "plain text" }. Verse markers are <b class="verse-num|chapter-num" id="v43003016-1">.
function parse_esv_verses(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var verses = {};
    var current = null;
    var skip = '.verse-num, .chapter-num, h2, h3, h4, .footnote, .extra_text';
    var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    var node;

    function verse_from_marker(element) {
        var fromId = /^v(\d{8})/.exec(element.id || '');
        if (fromId) {
            return parseInt(fromId[1], 10) % 1000;
        }
        var fromText = /(\d+)\s*$/.exec(element.textContent.replace(/\u00a0/g, ' ').trim());
        return fromText ? parseInt(fromText[1], 10) : null;
    }

    while ((node = walker.nextNode())) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches('.verse-num, .chapter-num')) {
                current = verse_from_marker(node);
                if (current !== null && !(current in verses)) {
                    verses[current] = '';
                }
            }
            else if (current !== null && node.matches('p, br, .line')) {
                verses[current] += ' ';
            }
        }
        else if (current !== null && !node.parentElement.closest(skip)) {
            verses[current] += node.nodeValue;
        }
    }
    Object.keys(verses).forEach(function (key) {
        verses[key] = verses[key].replace(/\s+/g, ' ').trim();
    });
    return verses;
}

function fetch_esv_passage(query) {
    if (typeof ESV_API_KEY === 'undefined' || !ESV_API_KEY) {
        return Promise.reject(new Error('The ESV API key is not configured on this page.'));
    }
    var url = 'https://api.esv.org/v3/passage/html/?q=' + encodeURIComponent(query) +
        '&include-passage-references=false&include-footnotes=false&include-short-copyright=false' +
        '&include-audio-link=false&include-headings=false';
    return bible_fetch(url, { headers: { 'Authorization': 'Token ' + ESV_API_KEY } }, 'ESV').then(function (data) {
        if (!data.passages || !data.passages.length) {
            throw new Error('English passage not found: ' + query);
        }
        return { canonical: data.canonical, parsed: data.parsed, verses: parse_esv_verses(data.passages.join('')) };
    });
}

// -> { verseNumber: "text" } for one chapter of the Chinese Union Version
function fetch_chinese_verses(ref) {
    var url = 'https://bible.helloao.org/api/cmn_cuv/' + ref.book.id + '/' + ref.chapter + '.json';
    return bible_fetch(url, undefined, 'Chinese Bible').then(function (chapter) {
        var verses = {};
        ((chapter.chapter && chapter.chapter.content) || []).forEach(function (item) {
            if (!item.number) {
                return;
            }
            var first = parseInt(String(item.number).split('-')[0], 10);   // merged verses arrive as "16-17"
            var text = extractText(item).trim();
            if (text && !isNaN(first)) {
                verses[first] = text;
            }
        });
        return verses;
    });
}

function combine_bible_passage(ref, english, chinese) {
    var numbers = ref.verses;
    if (!numbers) {   // whole chapter typed in Chinese: use whatever either language returned
        var all = {};
        Object.keys(chinese).concat(Object.keys(english.verses)).forEach(function (key) {
            all[key] = true;
        });
        numbers = Object.keys(all).map(Number).sort(function (a, b) { return a - b; });
    }
    var verses = numbers.map(function (n) {
        return { number: n, zh: chinese[n] || '', en: english.verses[n] || '' };
    }).filter(function (verse) {
        return verse.zh || verse.en;
    });
    if (!verses.length) {
        throw new Error('No verses found for that reference.');
    }
    return {
        title: {
            zh: ref.book.name + ' ' + ref.chapter + (ref.verses ? ':' + format_verse_ranges(ref.verses) : ''),
            en: english.canonical || esv_query_for(ref)
        },
        chapter: ref.chapter,
        verses: verses
    };
}

function lookup_bilingual_passage(input) {
    input = (input || '').trim();
    if (!input) {
        return Promise.reject(new Error('Enter a verse reference.'));
    }
    var ref;
    var english;
    var chineseRequest;

    if (/[a-zA-Z]/.test(input)) {
        // English input: ESV parses the reference for us, then we fetch the same verses in Chinese.
        chineseRequest = fetch_esv_passage(input).then(function (data) {
            english = data;
            ref = reference_from_esv(data);
            return fetch_chinese_verses(ref);
        });
    }
    else {
        try {
            ref = parse_chinese_reference(input);
        }
        catch (error) {
            return Promise.reject(error);
        }
        chineseRequest = Promise.all([fetch_esv_passage(esv_query_for(ref)), fetch_chinese_verses(ref)]).then(function (results) {
            english = results[0];
            return results[1];
        });
    }
    return chineseRequest.then(function (chinese) {
        return combine_bible_passage(ref, english, chinese);
    });
}
