var device = 'desktop';
var API_URL = '/API/';

    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        device = 'mobile';
    }



    // functions for rendering UI

    function move_top(tag) {
        scrollTo = $('div[' + tag + ']');
        $('html, body').animate({
            scrollTop:$(scrollTo).offset().top - 80
        }, 'slow');
    }
    
    // UI for Adding song to song_set
    function add_song_to_worship(worship_list) {
        worship_list.empty();
        var top_ul = document.createElement('ul');
        top_ul.setAttribute('id', 'songs');
        var i = 0;
        for (data of songs_temp) {
            var list = document.createElement('li');
            list.setAttribute('class', 'ui-state-default');
            list.setAttribute('name', data.id);

            if (data.type == 'song') {
                var html = '<div class="song-content-wrapper">';

                // Row 1: Title, Metadata, Delete Button
                html += '<div class="song-header-row">';
                html += '<span class="song-title" name="' + data.id + '" lang="' + data.lang + '">';
                html += '<b>' + data.title + '</b>&nbsp;' + lang_tag(data.lang) + '&nbsp;' + lang_tag(data.lang_2) + ' Author: ' + data.author;
                html += ' <button type="button" class="edit_btn icon-button" title="Edit Song"><i class="fa fa-edit"></i></button>';                
                html += '</span>';
                
                // Check if the screen is mobile (e.g., 768px or smaller)
                var isMobile = window.innerWidth <= 768;
                // Set the text based on the screen size
                var buttonText = isMobile ? '' : 'Remove Song ';

                html += '<button type="button" class="remove_btn" aria-label="Remove Song">' + buttonText + '<i class="fa-solid fa-trash"></i></button>';
                html += '</div>';

                // Row 2: Key, Media Links
                html += '<div class="song-details-row">';
                html += '<span>Current Key: <select class="key" name="' + data.transpose + '" init="' + data.song_key + '"><option>' + data.song_key + '</option></select></span>';
                html += '<span>&nbsp;Original Key: ' + data.song_key + '</span>';
                
                if (data.score) {
                    html += '<a href="' + data.score + '" target="new"><i style="font-size:24px" class="fa" title="Sheet Music">&#xf0f6;</i></a>';
                }
                if (data.abc.length > 0) {
                    html += '<a href="sheets/' + data.id + '" target="new"><i class="fa" style="font-size:24px" title="Interacted Sheet Music">&#xf1c7;</i></a>';
                }
                if (data.video) {
                    html += '<a href="' + data.video + '" target="new"><i class="fa fa-play-circle" style="font-size:24px" title="Youtube Video"></i></a>';
                }
                html += '</div>';

                // Row 3: Notes
                html += '<div class="song-notes-row">';
                html += '<p>Notes: <textarea name="song_notes" index="' + i + '" rows="5" cols="60">' + data.notes + '</textarea></p>';
                html += '</div>';

                // Row 4: Sequence Container
                html += '<div class="sequence-container">';

                html += `<div class="song_sequence_toggle" name="${data.id}" title="Click to arrange song sequence">`;
                html += '<i class="fa-solid fa-caret-right toggle-icon"></i>'; // The toggle triangle
                html += `<span class="song_sequence">Song Sequence: <span class="sequence" id="song-${data.id}_alt">${data.sequence}</span></span>`;

                html += '</div>'; // End toggle button

                html += '</div>'; // End sequence container

                html += '</div>'; // End main wrapper
                
                list.innerHTML = html;

                var ul = document.createElement('ul');
                ul.setAttribute('id', 'sequence_' + data.id);
                ul.setAttribute('class', 'lyrics');
                ul.setAttribute('style', 'display:none'); // Keeps it hidden initially

                for (let l of data.content) {
                    var list_1 = document.createElement('li');
                    // Added 'lyric-item' for flexbox targeting
                    list_1.setAttribute('class', 'ui-state-default lyric-item'); 
                    list_1.setAttribute('id', 'song-' + data.id + '_' + l.name);
                    
                    // Store the formatted text in a variable to keep the HTML string clean
                    var formatted_lyrics = l.origin_text.split("\n").join("<br />");

                    list_1.innerHTML = 
                        '<div name="lyrics_parts" class="lyric-content ' + l.name + '">' + 
                            '<strong>[' + l.name + ']</strong><br/>' + 
                            formatted_lyrics + 
                        '</div>' + 
                        '<div class="lyrics_buttons">' + 
                            '<button type="button" class="btn-lyric btn-lyric-add add_sequence_btn" title="Add Section"><i class="fa-solid fa-plus"></i></button>' + 
                            '<button type="button" class="btn-lyric btn-lyric-remove remove_sequence_btn" title="Remove Section"><i class="fa-solid fa-trash"></i></button>' + 
                        '</div>';
                        
                    ul.append(list_1);
                }
                
                var sequenceContainer = list.querySelector('.sequence-container');
                sequenceContainer.appendChild(ul);
            }
            else if (data.type == 'info') {
                list.innerHTML = '<span class="infotitle" name="' + data.id + '" bible="' + data.bible + '">' + data.notes + '&nbsp;<button class="remove_btn" style="display:none"> - </button></span>';
            }
            top_ul.append(list)
            i++;
        }
        worship_list.append(top_ul);
        return;
    }

    // Validate form values
    function validate_form(data) {
        // Have to use content instead of lyrics field right now. content is what the API accepts for changes to the lyrics

        // Sequence can not be empty
        if (!data.sequence || data.sequence.trim() === '') {
            alert("Sequence needs a value!");
            return false;
        }

        // Lyrics can not be empty
        if (!data.content || data.content.trim() === '') {
            alert("Are there... lyrics? The editor seems empty.");
            return false;
        }

        // Check for paired tags (e.g., <chorus>...</chorus>)
        // We temporarily rename numeric tags so the browser's DOM parser doesn't get confused
        const tagCompatibilityCheck = data.content.replace(/(<\/?)(\d)+(>)/g, '$1temp$2$3');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = tagCompatibilityCheck;
        
        if (tempDiv.innerHTML !== tagCompatibilityCheck) {
            alert("Tag mismatch! Ensure all tags are paired correctly (e.g., <1>...</1> or <chorus>...</chorus>).");
            return false;
        }

        // Check for duplicated section tags
        const tags = data.content.match(/<\/?[^>]+>/g) || [];
        const duplicates = tags.filter((item, index) => tags.indexOf(item) !== index);
        
        if (duplicates.length > 0) {
            alert("Duplicated sequence tags found: " + [...new Set(duplicates)].join(', '));
            return false;
        }

        // Check for malformed chord brackets [C [D]
        const malformedPattern = /\[[^\]]+\[/g;
        const malformedMatch = data.content.match(malformedPattern);
        if (malformedMatch) {
            alert("Check your chord brackets. It looks like some aren't closed properly: " + malformedMatch);
            return false;
        }

        return true;
    }

    // song related APIs
    function add_song(data) {
        url = API_URL + 'song/add';
        $.ajax({
            type: "post",
            url: url,
	        data: data,
            contentType: "application/json",
            dataType: 'json',
            complete: function(response) {
            console.log(response)
          	    if(response.status==200) {
                    return true;
    	        }
                else {
                    alert(response.responseText);
		        }
            }
        });
    }

    function get_songs_by_days(days, count) {
        url = API_URL + 'songs/ranking/' + days;
        if (count) {
            url += '/true';
        }
        return $.ajax({
            type: "GET",
            url: url
        });
    }

    function get_song(id) {
        url = API_URL + 'song/' + id;
        return $.ajax({
            type: "GET",
            url: url
        });
    }

    function get_songs(ids) {
        if (ids) {
            url = API_URL + 'songs/' + ids;
        }
        else {
            url = API_URL + 'songs';
        }
        return $.ajax({
            type: "GET",
            url: url
        });
    }

    function submit_song(url, data) {
        return $.ajax({
            type: "post",
            url: url,
	        data: data,
            /*complete: function(response) {
                if(response.status==200) {
                    console.log(response)
                    return response.responseText;
    	        }
                else {
                   alert(response.responseText);
                   return false;
		        }
            },*/
            contentType: "application/json",
            dataType: 'json'
        });
    }

    function data_changed(map2) {
        temp = [];
        for (let i of form_data) {
            find = map2.find(o=> o.value != i.value && o.name == i.name)
            if(find) {temp.push(find)}
        }
        return temp;
    }

    function render_song(id, db, lang, num) {
        let url = 'song/' + id + '/edit';
        if (db && lang) {
            url += '?db=' + db + '&lang=' + lang;
        }
        if (!num) {
            num = 0
        }
        let dialog_title = [{'title': 'Save Worship Song', 'text': 'Save', 'cancel': 'Cancel', 'action': 'edit'},
                            {'title': 'Add Worship Song', 'text': 'Add', 'cancel': 'Cancel', 'action': 'add'}];
        
        return $.ajax(url).then(function( response, textStatus, jqXHR ) {
            $("#dialog").html(response);
            $("#dialog").dialog({
                title: dialog_title[num]['title'],
                width: 'auto',
                position: {
                    my: "center top",
                    at: "center top+50",
                    of: window
                },
                // Workaround for position not working immediately
                open: function() {
                    var $thisDialog = $(this);
                    requestAnimationFrame(function() {
                        $thisDialog.dialog("option", "position", {
                            my: "center top",
                            at: "center top+50",
                            of: window
                        });
                    });
                },


                buttons: [
	                {
	                    id: "button-cancel",
                        type: "button",
                        text : dialog_title[num]['cancel'],
                        class: "btn btn-red",
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    },
                    {
    	                id: "button-add",
                        type: "button",
                        text : dialog_title[num]['text'],
                        class: "btn btn-green",
                        click: function() {
                            const currentState = window.getCurrentState();
                            if (!window.validate_form(currentState)) return;

                            var tempSubmit = [];
                            for (let key in currentState) {
                                if (key === 'id') continue;
                                tempSubmit.push({
                                    name: key,
                                    value: currentState[key]
                                });
                            }

                            console.log('tempSubmit', tempSubmit);
                            if (num == 0) {   // When popup is for edit
                                var click_url = API_URL + 'song/' + id;
                                submit_song(click_url, JSON.stringify(tempSubmit)).done(function(response) {
                                    console.log(response);
                                });
                                $("#dialog").dialog("close");
                                location.reload();
                                return false;
                            }

                            // Submit to API
                            var click_url = API_URL + 'song/add';
                            
                            const promised = new Promise(function(resolve, reject) {
                                submit_song(click_url, JSON.stringify(tempSubmit))
                                    .done(function(response) {
                                        // The API successfully added the song!
                                        // Pass the returned ID to the resolve function.
                                        resolve(response); 
                                    })
                                    .fail(function(jqXHR) {
                                        // The API failed. Pass the error text to the reject function.
                                        reject(jqXHR.responseText || 'Failed adding new song.');
                                    });
                            });
                            
                            // Handle the successful addition and link it to the worship set
                            promised.then(function(result) {
                                console.log('before closing, new song id:', result);
                                
                                get_song(result).done(function(data) {
                                    console.log('song_data', data);
                                    data['date'] = worship_data.date;
                                    songs_temp.push(data);
                                    
                                    $.when( add_song_to_worship(worship) ).then(function() {
                                        $(document).trigger('worshipUIUpdated');
                                    });
                                }).fail(function(err) {
                                    alert("Song was saved, but failed to fetch data for UI update.");
                                });
                                
                                $("#dialog").dialog("close");
                            })
                            .catch(function(error) {
                                // This will now print the actual error text from your backend API
                                alert("Error: " + error);
                            });
       
                        }
                    }
                ]
            });
        });
    }

    // Helper functions

    // Return language span tag to use different css
    function lang_tag(lang) {
        if(lang == '') { return ''; }
        tags = {'en': '<span class="lang_en" title="English">en</span>', 'zh': '<span class="lang_zh" title="Chinese">zh</span>', 'zh-TW': '<span class="lang_zhTW" title="Taiwanese">tw</span>', 'zh-pingyin': '<span class="lang_zhpingyin" title="Zh PingYin">zh</span>', 'others': '<span class="others">na</span>'}
        if (lang in tags) {
            return tags[lang];
        }
        return tags['others'];
    }

    // Return media links
    function get_links(video, score, id) {
        var links = '';
        links += video ? "<a href='" + video + "' target='new'><i class='fa fa-play-circle' style='font-size:24px' title='Youtube Video'></i></a>" : "";
        links += score ? "<a href='" + score + "' target='new'><i style='font-size:24px' class='fa' title='Sheet Music'>&#xf0f6;</i></a>" : "";
        links += id? "<a href='sheets/" + id + "' target='new'><i style='font-size:24px' class='fa' title='Interacted Sheet Music'>&#xf1c7;</i></a>" : "";
        return links;
    }

    // Highlighted search keyword in the song title
    function highlight_keyword(keyword, text) {
        var regEx = new RegExp((keyword.trim()), "ig");
        return text.replace(regEx, function(a){ return '<span class="highlighted">' + a + '</span>';});
    }

    // Search Youtube using song title and book name
    function search_video(key1, key2) {
        url ='https://www.youtube.com/results?search_query=' + key1 + ' ' + key2;
        window.open(url);
    }

    // Other functions

    // Export worship arrangement to zip file
    function export_file(id) {
        url = API_URL + 'worship/' + id + '/export';
        $.when( $.ajax( url ) ).then(function( data, textStatus, jqXHR ) {
            window.location.href = 'API/download?file=' + data;
        });
    }
