/*
    presentation.js: control worship slides
    param: target div
*/

    // Store worship set into object
    let ratio = window.screen.width/window.screen.height;
    let presentation;
    let slides = [];
    let pos = 0;
    let order = 0;
    let content_index = 0;
    let msg = '';
    let dynamic = '';
    let key_change = 0;
    let last_position = [-1, -1];
    let background = [];
    let mode = '';
    let touchableElement;
    let w_id;
    let adding_slide = 0;
    let slide_refreshed = false;

    // Socket Server url
    let socket_url = window.location.host;
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
            if (parseInt(diff) == 0) {
                continue;
            }
            key = keys.indexOf(init)+parseInt(diff);
            html += '<button name="transpose" title="Prepare to change to Key of ' + keys[key] + '" transpose="' + diff + '">Change Key to ' + keys[key] + '</button>';
        }
        return html;
    }

    function move_top(para) {
        scrollTo = $('div[class="inner present"]');
        base = $('.preview').offset().top;
        $('.preview').scrollTop(base);
        $('.preview').scrollTop($(scrollTo).offset().top - base);
    }

    function save_slides() {
        var url = '/API/worship/' + w_id + '/edit';
        $.ajax({
            url: url,
            success: function(data) {
                alert('Slides Refreshed');
                socket.emit('reload');
                window.location.href = '/slides/admin';
            },
            fail: function(data) {
                alert(data);
            }
        });
    }

    function show_data(pos) {
        data = slides[pos];
        // update admin/lead mode as well
        $('#slide_title').html(data.title);
        $('#slide_notes').html(data.notes)
        $('#top-left').html(data.title)
        if (mode == 'admin') {
            $('#fragment').empty();
            for(var i=0;i<=5;i++) {
                $('#fragment').append($('<option>', {
                    value: i,
                    text : i
                }));
            }
            $('#fragment').val(data.style.fragment);
        }
        else {
            b_left = [data.book, data.copyright, data.ccli];
            b_left = b_left.filter(n => n)
            $('#bottom-left').html(b_left.join(' · '))
        }
        b_right = [data.author, data.lyricist];
        b_right = b_right.filter(n => n)
        $('#bottom-right').html(b_right.join(' / '));
    }

    function show_msg() {
        if (msg != '') {
            $('#top-right').html(msg).fadeIn("slow");
        }
        else {
            $('#top-right').fadeOut("slow").empty();
        }
    }

    function create_view(type, origin, region, name) {
        let grid = document.createElement('div');
        grid.setAttribute('name', name);
        let grid_o = document.createElement('div');
        if (mode == 'admin') {
            grid_o.setAttribute('contentEditable', 'true');
        }
        grid_o.setAttribute('class', type + ' origin');
        let grid_r = document.createElement('div');
        if (mode == 'admin') {
            grid_r.setAttribute('contentEditable', 'true');
        }
        grid_r.setAttribute('class', type + ' region');
        grid_o.innerHTML = origin;
        grid_r.innerHTML = region;
        grid.append(grid_o, grid_r);
        return grid;
    }

    // Helper function to safely extract lines from either a list or raw text
    function parseContent(htmlString) {
        if (!htmlString) return { isList: false, lines: [] };

        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        let listItems = tempDiv.querySelectorAll('li');

        if (listItems.length > 0) {
            return { isList: true, lines: Array.from(listItems).map(li => li.innerHTML) };
        }
        else {
            let rawText = htmlString.replaceAll('\n', '<br/>');
            return { isList: false, lines: rawText.split(/<br\s*\/?>/i).filter(n => n.trim() !== '') };
        }
    }

    function load_slides() {
        $('.slides').empty();
        $('#slide_title').html(slides[pos].title);
        $('#slide_notes').html(slides[pos].notes);
        for(var i=0;i<slides.length;i++) {
            data = slides[i];
            bg_url = data.style.background;
            let section = document.createElement('section');
            if (bg_url) {
                bg_opacity = data.style.opacity
                section.setAttribute('data-background-image', bg_url);
                section.setAttribute('data-background-opacity', bg_opacity);
            }
            fragment = data.style.fragment;
            if(data.type == 'info') {
                // SETTING: Tune these numbers based on your presentation font size!
                //let max_lines_per_slide = 5;
                let max_chars_per_slide = 120; 

                let parsedOrigin = parseContent(data.content.origin_text);
                let parsedRegion = parseContent(data.content.region_text);

                let origin_lines = parsedOrigin.lines;
                let region_lines = parsedRegion.lines;
                let isList = parsedOrigin.isList; 

                    // NEW: Dynamic chunking based on both character count and line count
                    while (origin_lines.length > 0) {
                        let current_chunk_o = [];
                        let current_chunk_r = [];
                        let current_char_count = 0;

                        // Build the slide line-by-line
                        while (origin_lines.length > 0) {
                            let next_line_o = origin_lines[0];
                            
                            // Strip HTML tags to get an accurate count of visible characters
                            let next_line_text_only = next_line_o.replace(/(<([^>]+)>)/gi, "");
                            let next_line_length = next_line_text_only.length;

                            // If we already have at least 1 line AND adding the next line 
                            // pushes us over the char limit OR the line limit, stop building this slide.
                            if (current_chunk_o.length > 0 && 
                               (current_char_count + next_line_length > max_chars_per_slide || current_chunk_o.length >= fragment)) {
                                break; 
                            }

                            // Safe to add! Remove the line from our master list and add it to the chunk
                            current_chunk_o.push(origin_lines.shift());
                            if (region_lines.length > 0) {
                                current_chunk_r.push(region_lines.shift());
                            }
                            
                            current_char_count += next_line_length;
                        }

                        // Reconstruct the HTML for this specific chunk
                        let o_html = '';
                        let r_html = '';

                        if (isList) {
                            o_html = '<ul>' + current_chunk_o.map(obj => '<li>' + obj + '</li>').join('') + '</ul>';
                            r_html = current_chunk_r.length > 0 ? '<ul>' + current_chunk_r.map(obj => '<li>' + obj + '</li>').join('') + '</ul>' : '';
                        } 
                        else {
                            o_html = current_chunk_o.join('<br/>');
                            r_html = current_chunk_r.join('<br/>');
                        }
                        
                        let sub_section = document.createElement('section');
                        sub_section.append(create_view(data.type, o_html, r_html, 'info'));
                        section.append(sub_section);
                    }
            }
		    else if (data.type == 'song') {
			    for(var j=0;j<data.content.length;j++) {
			        s_name = data.content[j].name;
			        if (fragment > 0) {
			            origin_ = data.content[j].origin_text.split(/<br\/?>/).filter(n => n);
			            region_ = data.content[j].region_text.split(/<br\/?>/).filter(n => n);
			            while(origin_.length>0) {
			                o_fragment = origin_.splice(0, fragment).join('<br/>')
			                r_fragment = region_.splice(0, fragment).join('<br/>')
				            let sub_section = document.createElement('section');
				            sub_section.append(create_view(data.type, o_fragment, r_fragment, s_name));
      			            sub_section.setAttribute('order', j);
      			            section.append(sub_section);
			            }
			        }
			        else {
				        let sub_section = document.createElement('section');
				        sub_section.append(create_view(data.type, data.content[j].origin_text, data.content[j].region_text, s_name));
      			        sub_section.setAttribute('order', j);
  			            section.append(sub_section);
    			    }
			    }
		    }
		    else if (data.type == 'media') {
		        let sub_section = document.createElement('section');
				sub_section.setAttribute('data-background-iframe', data.content.origin_text);
  			    section.append(sub_section);
		    }
    		$('.slides').append(section);
    	}
    }

    function update_json(download) {
    $('#loading').show();
    data = JSON.stringify({"setting": setting, "slides": slides});
        $.ajax({
            type: "post",
            url: "/API/worship/" + w_id + "/json",
            data: data,
            contentType: "application/json",
            dataType: 'json',
            complete: function(response) {
                if(response.status==200) {
                    if(download) {
                        window.location = '/API/download?file=' + response.responseText;
                    }
                    else {
                        socket.emit('reload');
                    }
                }
            }
        });
        $('#loading').hide();
    }


    // socket.io event

    socket.on('connect', function () {
        console.log('connected to the server. I am ' , mode);
    });

    socket.on('reload', function (presentation) {
        slides = presentation['data'];
        console.log('Admin reload json data', slides);
        w_id = presentation['id'];
        adding_slide = 0;

        // When reload is broadcast, load the slide from the data and sync it before move to current pos and order
        load_slides();
        Reveal.sync();
        Reveal.slide(pos, order);
        change_slide();
    });

    socket.on('response', function (data) {
        pos = data.pos[0];
        order = data.pos[1];
        msg = data.msg;
        dynamic = data.dynamic;
        from = data.from;
        // TODO: For musician key change
        key_change = data.key;
        console.log('Server sent: pos:', pos, 'order', order, 'msg:', msg, 'key:', key_change, 'dynamic:', dynamic, 'from:', from);
        if (from!= mode) {
            slide_refreshed = true;
            Reveal.slide(pos, order);
            change_slide();
        }
    });

    function change_slide() {
        show_data(pos);
        show_msg();
        if(mode=='lead') {
            load_preview();
        }
    }


    // contentEditable for origin, region, title, and notes
    let div_content = {};
    $(document).on('click', '.admin', function() {
        $(this).attr('contentEditable', 'true');
        div_content[$(this).attr('class')] = $(this).html();
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
                // When title div is changed
                else if ($(this).attr('class').match('title')) {
                    console.log("changed")
                    slides[pos].title = temp;
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
                update_json();
            }
            div_content = {};
        }
    });

