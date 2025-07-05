/*
    presentation.js: control worship slides
    param: target div
*/

    // Store worship set into object
    let presentation;
    let slides = [];
    let pos = 0;
    let order = 0;
    let msg = '';
    let dynamic = '';
    let key_change = 0;
    let last_order = 0;
    let background = [];
    let mode = 'view';
    let touchableElement;

    // Socket Server url
    let socket_url = window.location.hostname;
    let socket = io.connect(socket_url);

    // init sharp and flat keys to be assigned to keys
    let sharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let flat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    let keys = sharp;
    let flat_keys = ["Db", "Eb", "F", "Ab", "Bb"];

    // parse chord to different key by transpose number
    function parse_chord(chord, diff) {
        //if (sharp.indexOf(chord)>=0) {
        if (flat_keys.indexOf(chord)>=0) {
    	    keys = flat;
        }
	    diff = Number(diff);
	    chord = chord.split('/');
        new_chord = []
        for(c in chord) {
    	    if(chord[c][1] == 'b' || chord[c][1] == '#') {
              	pos_ = keys.indexOf(chord[c].substring(0,2))+diff
              	if(pos_>= keys.length) {
          	    	pos_ = pos_-keys.length;
                }
                else if(pos_<0) {
            	    pos_ = keys.length+pos_;
                }
            new_chord.push(keys[pos_]+chord[c].substring(2));
        	chord[c] = chord[c].substring(0,2) + chord[c].substring(2);
            }
            else {
			    pos_ = keys.indexOf(chord[c][0])+diff
          	    if(pos_>= keys.length) {
          		    pos_ = pos_-keys.length;
                }
                else if(pos_<0) {
            	    pos_ = keys.length+pos_;
                }
                new_chord.push(keys[pos_]+chord[c].substring(1));
                chord[c] = chord[c][0] + chord[c].substring(1);
            }
        }
        if(diff) {
    	    return new_chord.join('/');
        }
	    return chord.join('/');
    }

    // Create buttons for pre-defined keys change
    function get_transpose(init, transpose) {
        html = ''
        if (sharp.indexOf(init)>=0) {
    	    keys = sharp;
        }
        for (diff of transpose) {
            if (diff == 0) {
                continue;
            }
            key = keys.indexOf(init)+diff;
            html += '<button name="transpose" title="Prepare to change Key to ' + keys[key] + '" transpose="' + diff + '">Change Key to ' + keys[key] + '</button>';
        }
        return html;
    }

    function start_timer(div) {
        /*
            timer function to display every second
            params div: target element to show timer
        */

        min = 0;
        hr = 0;
        setInterval(function() {
            var sec = Math.floor((new Date % (1000 * 60)) / 1000);
            sec_txt = sec;
            if (sec < 10) {
                sec_txt = '0'+sec;
            }
            if (sec == 0) {
                min += 1;
            }
            if (min == 60) {
                min = 0;
                hr += 1;
            }
            min_txt = min;
            if (min < 10) {
                min_txt = '0'+min;
            }
            div.html(hr + ':' + min_txt + ':' + sec_txt);
        }, 1000);
    }

    function move_remote(num) {
        /*
            function to move slide up and down, this will change the global variable for pos and order
            params num: 1 or -1
        */
        order = order + num;
        if (order >= slides[pos].content.length) {
            pos += 1;
            if(pos<=slides.length-1) {
                order = 0;
            }
            else {
                pos -= 1;
                order -= 1;
            }
        }
        else if (order < 0) {
            pos -= 1;
            if(pos<0) {
                pos = 0;
                order = 0;
            }
            else {
                order = slides[pos].content.length-1;
            }
        }
        socket.emit('control', {'type': 'pos', 'value': [pos, order]});
    }


    function move(type, num) {
        /*
            function to move song or slide, this will change the global variable for pos and order
            params type: 0 is song order, 1 is slide order
            params num: number to move
        */

        if (type == 0) {
            pos = pos + num;
            pos = pos<0 ? 0:pos;
            pos = pos>=slides.length ? pos-1:pos;
            order = 0;
        }
        else {
            order = order + num;
            order = order<0 ? 0:order;
            if (mode=='lead') {
                if (order >= slides[pos].content.length) {
                    if (pos+1<slides.length-1) {
                        order = 0;
                        pos += 1;
                    }
                    else {
                        order = order;
                    }
                }
            }
            else {
                order = order>=slides[pos].content.length? order-1:order;
            }
        }

        // Load presentation with new pos, order
        load(preview);

        // Send data back to socket server
        if (mode == 'admin' || mode == 'lead') {
            socket.emit('control', {'type': 'pos', 'value': [pos, order]});
        }
    }

    function preview_btn(data) {
        /*
            function to generate preview button
            params data: data of current song/slide
        */

        div = '';
        for (i in data) {
            if (i == order) {
                div += '<div class="inner current" id="current_' + i + '"><div>' + data[i].name + '</div>' + data[i].origin_text + '</div>';
            }
            else {
                div += '<div class="inner" id="current_' + i + '"><div>' + data[i].name + '</div>' + data[i].origin_text + '</div>';
            }
        }
        $('#preview_div').html(div);
    }

    function set_font_size(text, lang) {
        len = 0;
        text = text.split('<br/>')
        for (l of text) {
            if (l.length> len) {
                len = l.length;
            }
        }
        len = lang=='en'?len/1.6:len;
        /*if (mode == 'lead' || mode == 'admin') {
            if (len > 30) {
                return '';
            }
            else if (len < 10) {
                return 'small';
            }
            else {
                return 'small';
            }
        }*/
        if (len > 37) {
            return 'tiny';
        }
        else if (len > 30) {
            return 'tiny';
        }
        else if (len > 25) {
            return '';
        }
        else if (len >23) {
            return 'small2';
        }
        else if (len >20) {
            return 'small1';
        }
        else if (len >18) {
            return 'medium2';
        }
        else if (len >16) {
            return 'medium1';
        }
        else if (len >15) {
            return 'large2';
        }
        else {
            return 'large1';
        }
    }
    function _set_font_size(text, lang) {
        len = 0;
        text = text.split('<br/>')
        for (l of text) {
            if (l.length> len) {
                len = l.length;
            }
        }
        len = lang=='en'?len/1.6:len;
        /*if (mode == 'lead' || mode == 'admin') {
            if (len > 30) {
                return 'font-size: 2vw;line-height: 120%;';
            }
            else if (len < 10) {
                return 'font-size: 3vw;line-height: 120%;';
            }
            else {
                return 'font-size: 2.5vw;line-height: 120%;';
            }
        }*/
        if (len > 37) {
            return 'font-size: 2vw;line-height: 150%;';
        }
        else if (len > 30) {
            return 'font-size: 2.5vw;line-height: 140%;';
        }
        else if (len > 25) {
            return 'font-size: 3vw;line-height: 130%;';
        }
        else if (len >23) {
            return 'font-size: 3.5vw;line-height: 130%;';
        }
        else if (len >20) {
            return 'font-size: 4vw;line-height: 120%;';
        }
        else if (len >18) {
            return 'font-size: 4.5vw;line-height: 120%;';
        }
        else if (len >16) {
            return 'font-size: 5vw;line-height: 110%;';
        }
        else if (len >15) {
            return 'font-size: 5.5vw;line-height: 110%;';
        }
        else {
            return 'font-size: 6vw;line-height: 110%;';
        }
    }

    function show_notes(text) {
        text = text.replaceAll('\n', '<br/>');
        return '>'+ text + '</div>';
    }

    function set_info_font(len, align) {
        if (align) {
            align = 'text-align:' + align + ';';
        }
        if (len > 300) {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:1.5vw;line-height: 100%;' + align + '">';
            }
            return 'style="font-size:2.5vw;line-height: 120%;' + align + '">';
        }
        else if (len > 200) {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:2vw;line-height: 100%;' + align + '">';
            }
            return 'style="font-size:3.5vw;line-height: 130%;' + align + '">';
        }
        if (len < 100) {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:3vw;line-height: 100%;"' + align + '">';
            }
            return 'style="font-size:5.5vw;line-height: 120%;"' + align + '">';
        }
        else {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:2.5vw;line-height: 100%;"' + align + '">';
            }
            return 'style="font-size:4.5vw;line-height: 130%;"' + align + '">';
        }
    }

    function show_info(content, align) {
        text = content.origin_text;
        text = text.replaceAll('\n', '<br/>');
        len = text.length;
        if (mode=='admin' || mode=='lead') {
            len = len * 1.5;
        }
        //html = '<div class="' + mode + ' info origin" ' + set_info_font(len, align) + text + '</div>';
        html = '<div class="' + mode + ' info origin">'  + text + '</div>';
        if (content.region_text) {
            text = content.region_text;
            text = text.replaceAll('\n', '<br/>');
            len = text.length;
            if (mode=='admin' || mode=='lead') {
                len = len * 1.5;
            }
        //html += '<div class="' + mode + ' info region" ' + set_info_font(len, align) + text + '</div>';
        html += '<div class="' + mode + ' info region">'  + text + '</div>';
        }
        return html;
    }

    function show_lyrics(l, lang, lang_2) {
        //html = '<div class="' + mode + ' lyrics origin" style="';
        //html = '<div class="' + mode + ' lyrics origin ' + set_font_size(l.origin_text, lang) + '">' + l.origin_text + '</div>';
        html = '<div class="' + mode + ' lyrics origin">' + l.origin_text + '</div>';
        //html += set_font_size(l.origin_text, lang) + '">' + l.origin_text + '</div>';
        if (l.region_text) {
            //html += '<div class="' + mode + ' lyrics region ' + set_font_size(l.origin_text, lang) + '">' + l.region_text + '</div>';
            html += '<div class="' + mode + ' lyrics region">' + l.region_text + '</div>';
            //html += '<div class="' + mode + ' lyrics region" style="';
            //html += set_font_size(l.region_text, lang_2) + '">' + l.region_text + '</div>';
        }
        return html;
    }

    function load_container() {
                //<!--<button name="key">Change Key</button>-->
        container = {
            'view': '<div id="top-left"></div><div id="top-right"></div><div id="preview" class="preview view"></div><div id="bottom-left"></div><div id="bottom-right"></div>',
            'musician': '<div id="top-left"></div><div id="top-right"></div><div id="preview" class="preview view"></div><div id="bottom-left"></div><div id="bottom-right"></div>',
            'lead': '<div id="top-right"></div><div class="preview_container"><div id="preview"></div><div id="menu"><div id="dynamic_btn"><br/><button name="dynamic" title="Intro">Intro</button><button name="dynamic" title="Interlude">Interlude</button><button name="dynamic" title="Ending">Ending</button><br/><button name="dynamic" title="Ready tp Build up">Build Up</button><button name="dynamic" title="Slow Down">Slow Down</button><button name="dynamic" title="Speed Up">Speed Up</button><br/><button name="dynamic" title="Acapella">Acapella</button><button name="dynamic" title="Repeat Chorus">Repeat Chorus</button><button name="dynamic" title="Last Sentence">Last Sentence</button><div id="key_change"></div></div><div id="notes"></div></div><div id="preview_div"></div></div>',
            'remote': '<div id=buttons><button id="btn_previous">Up</button><button id="btn_next">Down</button></div>'
        }
        return container[mode]
    }

    function load(div) {
        /*
            function to load presentation, it will display the content based on current pos and order
            params div: target div to load presentation
        */

        if (msg) {
            $("#top-right").html(msg);
            $("#top-right").fadeIn();
        }
        else {
            $("#top-right").fadeOut();
        }

        if (dynamic) {
            if (mode == "musician") {
                $("#top-left").html(dynamic);
                $("#top-left").fadeIn();
            }
        }
        else {
            $("#top-left").fadeOut();
        }

        data = slides[pos];
        var slide = document.createElement('div');
        slide.setAttribute('name', pos);
        slide.setAttribute('class', 'content');
        if (data.type == 'song') {
            l = data.content[order];
            transpose = 'transpose' in data? parseInt(data.transpose): 0;
            reversed = data.reverse;
            if (mode=='musician') {     // musician mode will only show original lyrics with chord
                chords = l.origin_chord;
                if (transpose !=0) {
                    chords = chords.replace(/(data-chord=")([^"]+)/g, (match, g1, g2) => {return g1+parse_chord(g2, transpose);});
                }
                if (key_change != 0) {
                    if(last_order != order) {
                        $("#top-left").fadeOut();
                        chords = chords.replace(/(data-chord=")([^"]+)/g, (match, g1, g2) => {return g1+parse_chord(g2, key_change);});
                    }
                }
                slide.innerHTML += '<div class="song_chord" name="' + l.name + '">' + chords + '</div>';
                next = order+1;
                if (data.content[next]) {
                    n = data.content[next];
                    text = n.origin_chord.split('<br/>')[0]
                    if (transpose !=0) {
                        chords = chords.replace(/(data-chord=")([^"]+)/g, (match, g1, g2) => {return g1+parse_chord(g2, transpose);});
                    }
                    if (key_change!=0) {
                        text = text.replace(/(data-chord=")([^"]+)/g, (match, g1, g2) => {return g1+parse_chord(g2, key_change);});
                    }
                    slide.innerHTML += '<div class="song_chord next"' + n.name + '">' + text + '</div>';
                }
            }
            else {  // show both original and region content
                $("#bottom-left").html(data.title + ' (' + data.author + ')');
                //$("#bottom-right").html(data.book + ' ' + data.ccli + ' ' + data.copyright);
                $("#bottom-right").html(data.copyright + ' ' + data.ccli);
                if (l) {
                    slide.innerHTML += show_lyrics(l, data.lang, data.lang_2);
                }
            }
        }
        else if (data.type == 'info') {     // If slide type is info, display data.notes. TODO: info slide will be treated the same way song is displayed
            $("#bottom-left").html(data.title);
            $("#bottom-right").html(data.book);
            //html = '<div class="' + mode + ' notes" '
            html = show_info(data.content, data.align);
            slide.innerHTML += html;
        }
        else if (data.type == 'link') {
            $("#bottom-left").html(data.title);
            $("#bottom-right").html(data.book);
            if(mode=='admin' || mode=='lead') {
                html = '<div class="' + mode + ' link"><iframe src="' + data.content + '" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe><br/><textarea row="5" cols="60" id="google_url">' + data.content + '</textarea>';
            }
            else {
                html = '<div class="' + mode + ' link"><iframe src="' + data.content + '" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" onload="this.width=screen.width;this.height=screen.height;"></iframe>';
            }
            slide.innerHTML += html;
        }

        if(mode=='admin' || mode=='lead') {     // for admin and lead, show slide notes
            if ('transpose' in data) {
                $('#key_change').html(get_transpose(data.key, data.transpose))
            }
            html = '<div class="' + mode + ' notes" ';
            html += show_notes(data.notes);
            $("#notes").html(html);
            preview_btn(data.content);
        }

        div.empty();
        div.append(slide);

        if (data.background) {
            div.css('background-image', 'url(' + data.background + ')');
            if(data.type == 'image') {
                div.css('background-size', 'contain');
            }
        }
        else if (background.length>0) {
            i = Math.floor(Math.random() * background.length);
            div.css('background-image', 'url(' + background[i] + ')');
        }
        else {
            div.css('background-image', '');
        }
        last_order = order;
    }

    function update_json() {
    data = JSON.stringify(slides);
        $.ajax({
            type: "post",
            url: "/API/worship/" + w_id + "/json",
            data: data,
            contentType: "application/json",
            dataType: 'json',
            complete: function(response) {
                if(response.status==200) {
                    load(preview);
                }
            }
        });
    }

    // contentEditable for origin and region
    let div_content = {};
    $(document).on('click', '.admin', function() {
        $(this).attr('contentEditable', 'true');
        div_content[$(this).attr('class')] = $(this).html();
    });

    $(document).on('change', '#google_url', function() {
        slides[pos].content = $(this).val();
        update_json();
    });

    $(document).on('focusout', '.admin', function() {
        temp = $(this).html();
        current_elm = this;
        if ($(this).attr('class') in div_content) {
            if (temp != div_content[$(this).attr('class')]) {
                // When notes div is changed
                if ($(this).attr('class').match('notes')) {
                    console.log("changed")
                    slides[pos].notes = temp;
                }
                // When info div is changed
                else if ($(this).attr('class').match('info')) {
                    if ($(this).attr('class').match('origin')) {
                        console.log("changed");
                        slides[pos].content.origin_text = temp;
                    }
                    else if ($(this).attr('class').match('region')) {
                        console.log("changed");
                        slides[pos].content.region_text = temp;
                    }
                }
                // When lyrics div is changed
                else if ($(this).attr('class').match('lyrics')) {
                    if ($(this).attr('class').match('origin')) {
                        console.log("changed");
                        slides[pos].content[order].origin_text = temp;
                    }
                    else if ($(this).attr('class').match('region')) {
                        console.log("changed");
                        slides[pos].content[order].region_text = temp;
                    }
                }
                update_json()
            }
            div_content = {};
        }
    });

    // Events listener for admin view only
    $(document).on('keyup',function(e) {

        // If the keyup is inside content box, ignore them
        if (Object.keys(div_content).length > 0) {
            return false;
        }

        var code = e.keyCode || e.which;
        /* left=37, previous set;
           up=38, previous slide;
           right=39, next set;
           space=32, next slide;
           down=40, next slide;
           enter=13, next slide;
        */
        //key_code = [13, 32, 37, 38, 39, 40]; //remove 67 and 109 for now
        key_code = [37, 38, 39, 40]; //remove 13 and 32 for now
        if (key_code.indexOf(code)>=0) {
            switch(code) {
                case 13:
                    move(1, 1);
                    break;
                case 32:
                    move(1, 1);
                    break;
                case 40:
                    move(1, 1);
                    break;
                case 38:
                    move(1, -1);
                    break;
                case 37:
                    move(0, -1);
                    break;
                case 39:
                    move(0, 1);
                    break;
            }
        }
        return false;
    });

let touchstartX;
let touchstartY;
let touchendX;
let touchendY;

function valid_move(x, y) {
    xx = Math.abs(x);
    yy = Math.abs(y);
    if (xx > 100 || yy > 100) {
        direction = xx>yy? ['x', x]:['y', y];
        return direction;
    }
    return false;
}

function handleGesture() {
    x = touchendX - touchstartX;
    y = touchendY - touchstartY;
    position = valid_move(x, y);
    if (position) {
        if (position[0] == 'x') {
            if (position[1] > 0) {
                console.log('Swiped Right');
                move(0, -1);
            }
            else {
                console.log('Swiped Left');
                move(0, 1);
            }
        }
        else {
            if (position[1] > 0) {
                console.log('Swiped Down');
                move(1, -1);
            }
            else {
                console.log('Swiped Up');
                move(1, 1);
            }
        }
    }
}
