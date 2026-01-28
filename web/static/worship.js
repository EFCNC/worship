let device = 'desktop';
let API_URL = 'API/';

    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        device = 'mobile';
    }

    if (document.addEventListener) {
        document.addEventListener('fullscreenchange', exitHandler, false);
        document.addEventListener('mozfullscreenchange', exitHandler, false);
        document.addEventListener('MSFullscreenChange', exitHandler, false);
        document.addEventListener('webkitfullscreenchange', exitHandler, false);
    }

    function exitHandler() {
        if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
            //$('#preview').hide();
        }
    }

    // functions for rendering UI

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
                //list.innerHTML = '<span class="title" name="' + data.id + '" lang="' + data.lang + '"><b>' + data.title + '</b>&nbsp;' + lang_tag(data.lang) + '&nbsp;' + lang_tag(data.lang_2) + ' Author: ' + data.author + '/' + data.lyricist + '&nbsp;<button class="remove_btn" style="display:none"> - </button></span><br/>Current Key: <select class="key" name="' + data.transpose + '" init="' + data.key + '"><option>' + data.key + '</option></select>&nbsp;Original Key: ' +  data.key + '<p>Notes: <span name="song_notes" contenteditable="true">' + data.notes + '</p><span class="lyrics_section" title="Click to arrange song sequence" name="' + data.id + '">Song Sequence: <span class="sequence" id="song-' +  data.id + '_alt">' + data.sequence + '</span>&nbsp;&nbsp;<span class="edit_btn"><img style="display:none" src="../static/img/edit-button-icon.png" title="edit lyrics" name="' + data.id + '"/></span></span><br/><textarea rows="10" cols="100" class="lyrics_raw" name="lyrics_raw" id="lyrics_raw_' + data.id + '" style="display:none">' + data.lyrics_raw + '</textarea>';
                html = '<span class="title" name="' + data.id + '" lang="' + data.lang + '"><b>' + data.title + '</b>&nbsp;' + lang_tag(data.lang) + '&nbsp;' + lang_tag(data.lang_2) + ' Author: ' + data.author + '/' + data.lyricist + '&nbsp;<button class="remove_btn" style="display:none"> - </button></span><br/>Current Key: <select class="key" name="' + data.transpose + '" init="' + data.key + '"><option>' + data.key + '</option></select>&nbsp;Original Key: ' +  data.key
                if (data.score) {
                    html += '&nbsp;&nbsp;<a href="' + data.score + '" target=new><i style="font-size:24px" class="fa" title="Sheet Music">&#xf0f6;</i></a>';
                }
                if (data.abc) {
                    html += '&nbsp;&nbsp;<a href="sheets/' + data.id + '" target=new><i class="fa" style="font-size:24px" title="Interacted Sheet Music">&#xf1c7;</i></a>';
                }
                if (data.video) {
                    html += '&nbsp;&nbsp;<a href="' + data.video + '" target=new><i class="fa fa-play-circle" style="font-size:24px" title="Youtube Video"></i></a>';
                }
                //notes = data.notes?data.notes:'Enter Notes';
                //html += '<p>Notes: <span name="song_notes" contenteditable="true">' + notes + '</span></p>';
                html += '<p>Notes: <textarea name="song_notes" index="' + i + '" rols="5" cols="60">' + data.notes + '</textarea></p>';
                html += '<span class="lyrics_section" title="Click to arrange song sequence" name="' + data.id + '">Song Sequence: <span class="sequence" id="song-' +  data.id + '_alt">' + data.sequence + '</span></span>';
                list.innerHTML = html;
                var ul = document.createElement('ul');
                ul.setAttribute('id', 'sequence_' + data.id)
                ul.setAttribute('class', 'lyrics')
                ul.setAttribute('style', 'display:none');
                for(let l of data.content) {
                    var list_1 = document.createElement('li');
                    list_1.setAttribute('class', 'ui-state-default');
                    list_1.setAttribute('id', 'song-' + data.id + '_' + l.name);
                    list_1.innerHTML = '<div name="lyrics_parts" class="' + l.name + '">[' + l.name + ']' + '<br/>' + l.origin_text.split("\n").join("<br />") + '</div><div class="lyrics_buttons"><button class="add_btn"> + </button><button class="remove_sequence_btn"> - </button></div>';
                    ul.append(list_1)
                }
                list.append(ul);
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
    function validate_form() {

        // Sequence can not be empty
        sequence = $("input[name='sequence']").val();
        if(sequence == '') {
            alert("Sequence needs value!!");
            return false;
        }

        // Lyrics can not be empty
        content = $("textarea[name='content']").val();
        if(content == '') {
            alert("Please enter the lyrics!!");
            return false;
        }

        // Sequence sections are using paired tag
        temp = content.replace(/(<\/?)(\d)+(>)/g, '$1temp$2$3')
        var doc = document.createElement('div');
        doc.innerHTML = temp;
        if ( doc.innerHTML !== temp ) {
            alert("The Song Sequence tags are not matched, please make sure sequence is using open and close tags as a pair. ex: <1>...</1>");
            return false;
        }

        // No duplicated sequence section
        let tags = content.match(/<\/?[^>]+>/g);
        if (!tags) {
            alert('Please mark lyrics with sequence tags!!');
            return false;
        }
        let duplicates = tags.filter((item, index) => tags.indexOf(item) !== index);
        if (duplicates.length > 0) {
            alert('Duplicated sequence tag been used. ' + duplicates.toString());
            return false;
        }

        // chords symbols are in []
        let pattern = /\[[^\]]+\[/g;
        let result = content.match(pattern);
        if (result) {
            alert("Please make sure Chords and region are marked in '[' and ']'. The following are not correct..." + result);
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
        url = 'song/' + id;
        if (db && lang) {
            url += '?db=' + db + '&lang=' + lang;
        }
        if (!num) {
            num = 0
        }
        dialog_title = [{'title': 'Save Worship Song', 'text': 'Save', 'cancel': 'Cancel', 'action': 'edit'}, {'title': 'Add Worship Song', 'text': 'Add', 'cancel': 'Cancel', 'action': 'add'}]
        $.when( $.ajax( url ) ).then(function( response, textStatus, jqXHR ) {
            $("#dialog").html(response);
            $("#dialog").dialog({
                title: dialog_title[num]['title'],
                width: 'auto',
                buttons: [
	                {
    	                id: "button-add",
                        text : dialog_title[num]['text'],
                        click: function() {
                            if (!validate_form()) {
                                return false;
                            }
                            if (num ==0) {
                                click_url = API_URL + 'song/' + id + '/' +  dialog_title[num]['action'];
                                temp = data_changed($("#song_form").serializeArray());
                                if (temp) {
                                    submit_song(click_url, JSON.stringify(temp));
                                }
                                $( this ).dialog( "close" );
                            }
                            else {
                                click_url = API_URL + 'song/' +  dialog_title[num]['action'];
                                const promised = new Promise(function(resolve, reject) {
                                    const song_id = submit_song(click_url, JSON.stringify($("#song_form").serializeArray()));
                                    if (song_id) {
                                        return resolve(song_id);
                                    }
                                    else {
                                        return reject('Failed adding new song.');
                                    }
                                });
                                promised.then(function(result) {
                                    console.log('before closing', result);
                                    get_song(result).done(function(data) {
                                        console.log('song_data', data);
                                        data['date'] = worship_data.date;
                                        songs_temp.push(data);
                                        $.when( add_song_to_worship(worship)).then(function() {
                                            init();
                                        });
                                    });
                                    $('#dialog').dialog( "close" );
                                })
                                .catch(function(error) {
                                    alert(error);
                                });
                            }
                        }
                    },
	                {
	                    id: "button-cancel",
                        text : dialog_title[num]['cancel'],
                        click: function() {
                            $( this ).dialog( "close" );
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
        links += video ? "<a href='" + video + "' target='new'><i class='fa fa-play-circle' style='font-size:24px' title='Youtube Video'></i></a>&nbsp;" : "";
        links += score ? "<a href='" + score + "' target='new'><i style='font-size:24px' class='fa' title='Sheet Music'>&#xf0f6;</i></a>&nbsp;" : "";
        links += id? "<a href='sheets/" + id + "' target='new'><i style='font-size:24px' class='fa' title='Interacted Sheet Music'>&#xf1c7;</i></a>&nbsp;" : "";
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
