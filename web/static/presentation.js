/*
    presentation.js: control worship slides
*/

    // Store worship set into object
    let presentation;
    let slides = [];
    let pos = 0;
    let order = 0;
    let msg = '';
    let dynamic = '';
    let key_change = 0;
    let last_position = [-1, -1];
    let background = [];
    let mode = '';
    let lang = '';
    let touchableElement;
    let w_id;
    let adding_slide = 0;

    // Socket Server url
    let socket_url = window.location.hostname;
    let socket = io.connect(socket_url);

    // init sharp and flat keys to be assigned to keys
    let sharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let flat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    let keys = sharp;
    let flat_keys = ["Db", "Eb", "F", "Ab", "Bb"];


    socket.on('connect', function () {
        console.log('connected to the server');
    });

    socket.on('response', function (data) {
        console.log('Server sent: ' + data);
        slides = data.data;
        pos = data.pos[0];
        order = data.pos[1];
        msg = data.msg;
        dynamic = data.dynamic;
        key_change = data.key;
        background = data.background;
        load(preview);
    });

    function load() {
        load_view();
    }

    function init(mode_name) {
        container = {
            'view': '<div id="top-left" class="sticky"></div><div id="top-right" class="sticky"></div><div id="bottom-left" class="sticky"></div><div id="bottom-right" class="sticky"></div>',
        }
        $(container[mode_name]).appendTo('.reveal');
    }

    function create_view(origin, region) {
        let grid = document.createElement('div');
        grid.setAttribute('class', 'grid-container');
        let grid_o = document.createElement('div');
        grid_o.setAttribute('class', 'origin');
        let grid_r = document.createElement('div');
        grid_r.setAttribute('class', 'region');
        grid_o.innerHTML = origin;
        grid_r.innerHTML = region;
        grid.append(grid_o, grid_r);
        return grid;
    }

    function load_view() {
        for(var i=0;i<slides.length;i++) {
            data = slides[i];
            let section = document.createElement('section');
            if(data.type == 'info') {
                section.append(create_view(data.content.origin_text, data.content.region_text));
		    }
		    else if (data.type == 'song') {
			    for(var j=0;j<data.content.length;j++) {
				    let sub_section = document.createElement('section');
				    sub_section.append(create_view(data.content[j].origin_text, data.content[j].region_text));
    			    section.append(sub_section);
			    }
		    }
    		$('.slides').append(section);
    	}
    }

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
            if (parseInt(diff) == 0) {
                continue;
            }
            key = keys.indexOf(init)+parseInt(diff);
            html += '<button name="transpose" title="Prepare to change to Key of ' + keys[key] + '" transpose="' + diff + '">Change Key to ' + keys[key] + '</button>';
        }
        return html;
    }

    function show_info(content, align) {
        text = content.origin_text;
        text = text.replaceAll('\n', '<br/>');
        html = '<div class="' + mode + ' info origin" style="text-align:' + align + '">'  + text + '</div>';
        if (content.region_text) {
            text = content.region_text;
            text = text.replaceAll('\n', '<br/>');
            html += '<div class="' + mode + ' info region" style="text-align:' + align + '">'  + text + '</div>';
        }
        return html;
    }