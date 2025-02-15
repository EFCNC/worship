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
    let keys = flat;

    // parse chord to different key by transpose number
    function parse_chord(chord, diff) {
        if (sharp.indexOf(chord)>=0) {
    	    keys = sharp;
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
            	    pos_ = keys.length+pos;
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
            	    pos_ = keys.length+pos;
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
        for (key of transpose) {
            if (key == 0) {
                continue;
            }
            key = keys.indexOf(init)+key;
            html += '<button name="transpose" title="Prepare to change Key to ' + keys[key] + '" transpose="' + key + '">Change Key to ' + keys[key] + '</button>';
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
        socket.emit('control', {'type': 'pos', 'value': [pos, order]});
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
        if (mode == 'lead' || mode == 'admin') {
            if (len > 30) {
                return 'font-size: 2vw;line-height: 120%;';
            }
            else if (len < 10) {
                return 'font-size: 3vw;line-height: 120%;';
            }
            else {
                return 'font-size: 2.5vw;line-height: 120%;';
            }
        }
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
        len = text.length;
        if (mode=='admin' || mode=='lead') {
            len = len * 1.5;
        }
        if (len > 300) {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:1.5vw;line-height: 100%;">'+ text + '</div>';
            }
            return 'style="font-size:2.5vw;line-height: 120%;">'+ text + '</div>';
        }
        else if (len > 200) {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:2vw;line-height: 100%;">'+ text + '</div>';
            }
            return 'style="font-size:3.5vw;line-height: 130%;">'+ text + '</div>';
        }
        if (len < 100) {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:3vw;line-height: 100%;">'+ text + '</div>';
            }
            return 'style="font-size:5.5vw;line-height: 120%;">'+ text + '</div>';
        }
        else {
            if (mode=='admin' || mode=='lead') {
                return 'style="font-size:2.5vw;line-height: 100%;">'+ text + '</div>';
            }
            return 'style="font-size:4.5vw;line-height: 130%;">'+ text + '</div>';
        }
    }

    function show_lyrics(reversed, l, lang, lang_2) {
        if (reversed && l.region_text) {
            html = '<div class="' + mode + ' lyrics origin" style="';
            html += set_font_size(l.region_text, lang_2) + '">' + l.region_text + '</div>';
            html += '<div class="' + mode + ' lyrics region" style="';
            html += set_font_size(l.origin_text, lang) + '">' + l.origin_text + '</div>';
        }
        else {
            html = '<div class="' + mode + ' lyrics origin" style="';
            html += set_font_size(l.origin_text, lang) + '">' + l.origin_text + '</div>';
            if (l.region_text) {
                html += '<div class="' + mode + ' lyrics region" style="';
                html += set_font_size(l.region_text, lang_2) + '">' + l.region_text + '</div>';
            }
        }
        return html;
    }

    function load_container() {
                //<!--<button name="key">Change Key</button>-->
        container = {
            'view': '<div id="top-left"></div><div id="top-right"></div><div id="preview" class="preview view"></div><div id="bottom-left"></div><div id="bottom-right"></div>',
            'musician': '<div id="top-left"></div><div id="top-right"></div><div id="preview" class="preview view"></div><div id="bottom-left"></div><div id="bottom-right"></div>',
            'lead': '<div id="top-right"></div><div class="preview_container"><div id="preview"></div><div id="menu"><div id="dynamic_btn"><br/><button name="dynamic" title="Intro">Intro</button><button name="dynamic" title="Interlude">Interlude</button><button name="dynamic" title="Ending">Ending</button><br/><button name="dynamic" title="Ready tp Build up">Build Up</button><button name="dynamic" title="Slow Down">Slow Down</button><button name="dynamic" title="Speed Up">Speed Up</button><br/><button name="dynamic" title="Acapella">Acapella</button><button name="dynamic" title="Repeat Chorus">Repeat Chorus</button><button name="dynamic" title="Last Sentence">Last Sentence</button><div id="key_change"></div></div><div id="notes"></div></div><div id="preview_div"></div></div>'
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
            $("#top-left").html(dynamic);
            $("#top-left").fadeIn();
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

            reversed = data.reverse;
            if (mode=='musician') {     // musician mode will only show original lyrics with chord
                chords = l.origin_chord;
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
                    if (key_change!=0) {
                        text = text.replace(/(data-chord=")([^"]+)/g, (match, g1, g2) => {return g1+parse_chord(g2, key_change);});
                    }
                    slide.innerHTML += '<div class="song_chord next"' + n.name + '">' + text + '</div>';
                }
            }
            else {  // show both original and region content
                $("#bottom-left").html(data.title + ' ' + data.author + ' ' + data.lyricist);
                $("#bottom-right").html(data.book + ' ' + data.ccli + ' ' + data.copyright);
                if (l) {
                    slide.innerHTML += show_lyrics(reversed, l, data.lang, data.lang_2);
                }
            }
        }
        else if (data.type == 'info') {     // If slide type is info, display data.notes. TODO: info slide will be treated the same way song is displayed
            $("#bottom-left").html(data.title);
            $("#bottom-right").html(data.book);
            html = '<div class="' + mode + ' notes" '
            html += show_notes(data.notes);
            slide.innerHTML += html;
        }

        if(mode=='admin' || mode=='lead') {     // for admin and lead, show slide notes
            $('#key_change').html(get_transpose(data.key, data.transpose))
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
        // TODO: needs to figure out why animate not working
        /*if (mode == 'musician') {
            div.slideDown('slow')//.animate({'opacity': 'show', 'paddingTop': 0});
        }
        else {
            div.fadeIn('slow');
        }*/
        last_order = order;
    }

    // Events listener for admin view only
    $(document).on('keyup',function(e) {

        // If mode is not admin or lead, ignore them
        if (mode != 'admin' || mode != 'lead') {
            return false;
        }

        // If the keyup is inside content box, ignore them
        if ($('#content').is(":focus")) {
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
        key_code = [13, 32, 37, 38, 39, 40]; //remove 67 and 109 for now
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
