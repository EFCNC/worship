    let book_names;
    let chapters;
    let book_name = [
    {
        "id": "GEN",
        "name": "創世記",
        "s_name": "創"
    },
    {
        "id": "EXO",
        "name": "出埃及記",
        "s_name": "出"
    },
    {
        "id": "LEV",
        "name": "利未記",
        "s_name": "利"
    },
    {
        "id": "NUM",
        "name": "民數記",
        "s_name": "民"
    },
    {
        "id": "DEU",
        "name": "申命記",
        "s_name": "申"
    },
    {
        "id": "JOS",
        "name": "約書亞記",
        "s_name": "書"
    },
    {
        "id": "JDG",
        "name": "士師記",
        "s_name": "士"
    },
    {
        "id": "RUT",
        "name": "路得記",
        "s_name": "得"
    },
    {
        "id": "1SA",
        "name": "撒母耳記上",
        "s_name": "撒上"
    },
    {
        "id": "2SA",
        "name": "撒母耳記下",
        "s_name": "撒下"
    },
    {
        "id": "1KI",
        "name": "列王紀上",
        "s_name": "王上"
    },
    {
        "id": "2KI",
        "name": "列王紀下",
        "s_name": "王下"
    },
    {
        "id": "1CH",
        "name": "歷代志上",
        "s_name": "代上"
    },
    {
        "id": "2CH",
        "name": "歷代志下",
        "s_name": "代下"
    },
    {
        "id": "EZR",
        "name": "以斯拉記",
        "s_name": "拉"
    },
    {
        "id": "NEH",
        "name": "尼希米記",
        "s_name": "尼"
    },
    {
        "id": "EST",
        "name": "以斯帖記",
        "s_name": "斯"
    },
    {
        "id": "JOB",
        "name": "約伯記",
        "s_name": "伯"
    },
    {
        "id": "PSA",
        "name": "詩篇",
        "s_name": "詩"
    },
    {
        "id": "PRO",
        "name": "箴言",
        "s_name": "箴"
    },
    {
        "id": "ECC",
        "name": "傳道書",
        "s_name": "傳"
    },
    {
        "id": "SNG",
        "name": "雅歌",
        "s_name": "歌"
    },
    {
        "id": "ISA",
        "name": "以賽亞書",
        "s_name": "賽"
    },
    {
        "id": "JER",
        "name": "耶利米書",
        "s_name": "耶"
    },
    {
        "id": "LAM",
        "name": "耶利米哀歌",
        "s_name": "哀"
    },
    {
        "id": "EZK",
        "name": "以西結書",
        "s_name": "結"
    },
    {
        "id": "DAN",
        "name": "但以理書",
        "s_name": "但"
    },
    {
        "id": "HOS",
        "name": "何西阿書",
        "s_name": "何"
    },
    {
        "id": "JOL",
        "name": "約珥書",
        "s_name": "珥"
    },
    {
        "id": "AMO",
        "name": "阿摩司書",
        "s_name": "摩"
    },
    {
        "id": "OBA",
        "name": "俄巴底亞書",
        "s_name": "俄"
    },
    {
        "id": "JON",
        "name": "約拿書",
        "s_name": "拿"
    },
    {
        "id": "MIC",
        "name": "彌迦書",
        "s_name": "彌"
    },
    {
        "id": "NAM",
        "name": "那鴻書",
        "s_name": "鴻"
    },
    {
        "id": "HAB",
        "name": "哈巴谷書",
        "s_name": "哈"
    },
    {
        "id": "ZEP",
        "name": "西番雅書",
        "s_name": "番"
    },
    {
        "id": "HAG",
        "name": "哈該書",
        "s_name": "該"
    },
    {
        "id": "ZEC",
        "name": "撒迦利亞書",
        "s_name": "亞"
    },
    {
        "id": "MAL",
        "name": "瑪拉基書",
        "s_name": "瑪"
    },
    {
        "id": "MAT",
        "name": "馬太福音",
        "s_name": "太"
    },
    {
        "id": "MRK",
        "name": "馬可福音",
        "s_name": "可"
    },
    {
        "id": "LUK",
        "name": "路加福音",
        "s_name": "路"
    },
    {
        "id": "JHN",
        "name": "約翰福音",
        "s_name": "約"
    },
    {
        "id": "ACT",
        "name": "使徒行傳",
        "s_name": "徒"
    },
    {
        "id": "ROM",
        "name": "羅馬書",
        "s_name": "羅"
    },
    {
        "id": "1CO",
        "name": "哥林多前書",
        "s_name": "林前"
    },
    {
        "id": "2CO",
        "name": "哥林多後書",
        "s_name": "林後"
    },
    {
        "id": "GAL",
        "name": "加拉太書",
        "s_name": "加"
    },
    {
        "id": "EPH",
        "name": "以弗所書",
        "s_name": "弗"
    },
    {
        "id": "PHP",
        "name": "腓立比書",
        "s_name": "腓"
    },
    {
        "id": "COL",
        "name": "歌羅西書",
        "s_name": "西"
    },
    {
        "id": "1TH",
        "name": "帖撒羅尼迦前書",
        "s_name": "帖前"
    },
    {
        "id": "2TH",
        "name": "帖撒羅尼迦後書",
        "s_name": "帖後"
    },
    {
        "id": "1TI",
        "name": "提摩太前書",
        "s_name": "提前"
    },
    {
        "id": "2TI",
        "name": "提摩太後書",
        "s_name": "提後"
    },
    {
        "id": "TIT",
        "name": "提多書",
        "s_name": "多"
    },
    {
        "id": "PHM",
        "name": "腓利門書",
        "s_name": "門"
    },
    {
        "id": "HEB",
        "name": "希伯來書",
        "s_name": "來"
    },
    {
        "id": "JAS",
        "name": "雅各書",
        "s_name": "雅"
    },
    {
        "id": "1PE",
        "name": "彼得前書",
        "s_name": "彼前"
    },
    {
        "id": "2PE",
        "name": "彼得後書",
        "s_name": "彼後"
    },
    {
        "id": "1JN",
        "name": "約翰一書",
        "s_name": "約一"
    },
    {
        "id": "2JN",
        "name": "約翰二書",
        "s_name": "約二"
    },
    {
        "id": "3JN",
        "name": "約翰三書",
        "s_name": "約三"
    },
    {
        "id": "JUD",
        "name": "猶大書",
        "s_name": "猶"
    },
    {
        "id": "REV",
        "name": "啟示錄",
        "s_name": "啟"
    }
]
    function fetch_books() {
        fetch(`https://bible.helloao.org/api/cmn_cuv/books.json`)
            .then(request => request.json())
                .then(books => {
                    book_names = books;
                    console.log(book_names.books.map(obj=>({id:obj.id, name:obj.name, s_name:obj.name[0]})))
        });
    }

    function show_verse(response) {
        html = [];
        for (var i=1;i<response.length;i++) {
            temp = response[i][0];
            vv = [];
            if (temp.content.length > 1) {
                for(var j=0;j<temp.content.length;j++) {
                    vv.push(temp.content.filter(obj=>typeof obj == "string" || Object.keys(obj).includes('text')).map(obj=>Object.keys(obj).includes('text')? obj.text: obj))
                }
            }
            else {
                vv = [temp.content[0]]
            }
            html.push(temp.number + '' + vv.join('<br/'));
        }
        $("#dialog").html(html.join('<br/>'));
        $("#dialog").dialog({
            title: response[0],
            width: 'auto',
            buttons: [
	            {
    	            id: "button-ok",
                    text : "OK",
                    click: function() {
                        $( this ).dialog( "close" );
                    }
                }
            ]
        });
    }

    async function get_bible(callback, name) {
        var b_name = name.match(/\D+/g)[0]; // Get book name
        name = name.replace(b_name, '');
        var ch_ver = name.split(':');
        var ch = ch_ver[0];
        var ver = [];
        var parts = ch_ver[1].split(',');
        for (var k=0;k<parts.length;k++) {
            t = parts[k].split('-');
            if(t.length>1) {
                for(var n=t[0];n<=t[1];n++) {
                    ver.push(n);
                }
            }
            else {
                ver.push(t[0]);
            }
        }
        b_name = b_name.trim();
        var verses = [b_name + ' ' + name];
        ver = ver.map(Number);
        b_name = book_name.filter(obj=>{return obj.s_name == b_name || obj.name == b_name}).map(obj=>obj.id);
        var url = 'https://bible.helloao.org/api/cmn_cuv/' + b_name + '/' + ch + '.json';
        console.log(url)
        fetch(url)
            .then(request => request.json())
                .then(chapter => {
                    for (var i=0;i<ver.length;i++) {
                        verses.push(chapter.chapter.content.filter(obj => {return obj.number == ver[i]}));
                    }
                    callback(verses);
                });
    }

