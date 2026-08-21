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