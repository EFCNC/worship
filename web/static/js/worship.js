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

const SEQUENCE_MAPPER = {
    rules: [
        { canonical: 'verse', prefix: 'v', defaultLabel: 'Verse' },
        { canonical: 'chorus', prefix: 'c', defaultLabel: 'Chorus' },
        { canonical: 'bridge', prefix: 'b', defaultLabel: 'Bridge' },
        { canonical: 'prechorus', prefix: 'pre', defaultLabel: 'Pre-Chorus' },
        { canonical: 'postchorus', prefix: 'post', defaultLabel: 'Post-Chorus' },
        { canonical: 'tag', prefix: 'tag', defaultLabel: 'Tag' },
        { canonical: 'vamp', prefix: 'vamp', defaultLabel: 'Vamp' },
        { canonical: 'intro', prefix: 'in', defaultLabel: 'Intro' },
        { canonical: 'outro', prefix: 'out', defaultLabel: 'Outro' },
        { canonical: 'interlude', prefix: 'inst', defaultLabel: 'Interlude' },
        { canonical: 'instrumental', prefix: 'inst', defaultLabel: 'Instrumental' }
    ],

    parseToken: function(rawToken) {
        if (!rawToken) return null;
        const token = rawToken.trim().toLowerCase();

        // Matches prefix + optional number (e.g., "v1", "c", "pre2")
        const match = token.match(/^([a-z\-]+)(\d*)$/);
        if (match) {
            const prefix = match[1];
            const numStr = match[2];
            const index = numStr ? Math.max(0, parseInt(numStr, 10) - 1) : 0;

            const rule = this.rules.find(r => r.prefix === prefix || r.canonical === prefix);
            if (rule) {
                const displayNum = numStr ? ` ${numStr}` : '';
                return {
                    tag: rawToken,
                    sectionName: rule.canonical,
                    index: index,
                    displayHeader: `${rule.defaultLabel}${displayNum}`
                };
            }
        }
        
        return { tag: rawToken, sectionName: token, index: 0, displayHeader: rawToken };
    },

    getShortTag: function(sectionName, index, totalCount) {
        const cleanName = sectionName.toLowerCase().replace('-', '');
        const rule = this.rules.find(r => r.canonical === cleanName);
        const prefix = rule ? rule.prefix : cleanName;
        // If there's only 1 version, return just the prefix (e.g., 'c'). Otherwise append number ('c1').
        return totalCount > 1 ? `${prefix}${index + 1}` : prefix; 
    },

    getLyricText: function(contentArray, sectionName, index) {
        if (!Array.isArray(contentArray)) return { lang1: '', lang2: '' };
        
        const section = contentArray.find(c => c.name && c.name.toLowerCase().replace('-', '') === sectionName.replace('-', ''));
        if (!section) return { lang1: '', lang2: '' };

        const extractText = (textSource, idx) => {
            if (Array.isArray(textSource)) return textSource[idx] !== undefined ? textSource[idx] : (textSource[0] || '');
            if (typeof textSource === 'string') return textSource;
            return '';
        };

        return {
            // Strictly using origin_text as requested
            lang1: extractText(section.origin_text, index),
            lang2: extractText(section.region_text || section.region, index) 
        };
    }
};

// Helper function to build a single song <li>
function generate_song_card(data, index) {
    var list = document.createElement('li');
    list.setAttribute('class', 'ui-state-default');
    list.setAttribute('name', data.id);

    if (data.type == 'song') {
        var activeSequence = data.alt_sequence || '';

        var html = '<div class="song-content-wrapper">';

            // Row 1: Title, Metadata, Delete Button
            html += '<div class="song-header-row">';
            html += '<span class="song-title" name="' + data.id + '" lang="' + data.lang + '">';
            html += '<b>' + data.title + '</b>&nbsp;' + lang_tag(data.lang) + '&nbsp;' + lang_tag(data.lang_2) + ' Author: ' + data.author;
            html += ' <button type="button" class="edit_btn icon-button" title="Edit Song"><i class="fa fa-edit"></i></button>';                
            html += '</span>';
            
            var isMobile = window.innerWidth <= 768;
            var buttonText = isMobile ? '' : 'Remove Song ';

            html += '<button type="button" class="remove_btn" aria-label="Remove Song">' + buttonText + '<i class="fa-solid fa-trash"></i></button>';
            html += '</div>';

            // Row 2: Key, Media Links
            html += '<div class="song-details-row">';
            html += '<span>Current Key: <select class="key" name="' + data.transpose + '" init="' + data.song_key + '"><option>' + data.song_key + '</option></select></span>';
            html += '<span>Original Key: ' + data.song_key + '</span>';
            html += get_links(data.video, data.score, data.abc, data.id);
            html += '</div>';

            // Row 3: Notes
            html += `
                <div class="song-notes-row">
                    <div class="notes-container" style="width: 100%;">
                        <label for="song-notes-${index}" style="display: block; margin-bottom: 5px; font-weight: bold;">Song Notes:</label>
                        <textarea id="song-notes-${index}" name="song_notes" data-index="${index}" rows="2">${data.notes || ''}</textarea>
                    </div>
                </div>`;

            let paletteButtons = '';
            if (Array.isArray(data.content)) {
                data.content.forEach(c => {
                    // Strictly use origin_text to determine array counts
                    let textSource = c.origin_text; 
                    if (!textSource) return; 
                    
                    let count = Array.isArray(textSource) ? textSource.length : 1;
                    
                    for (let i = 0; i < count; i++) {
                        let tag = SEQUENCE_MAPPER.getShortTag(c.name, i, count);
                        paletteButtons += `<button type="button" class="btn-palette ${c.name}" data-sec="${tag}" data-id="${data.id}">[${tag}]</button>`;
                    }
                });
            }

            // Row 4: Sequence Container
            html += `
                    <div class="song_sequence_toggle" name="${data.id}" title="Click to arrange song sequence">
                        <i class="fa-solid fa-caret-right toggle-icon"></i>
                        <span class="song_sequence">Song Sequence: 
                            <span class="sequence" id="song-${data.id}_alt">${activeSequence}</span>
                        </span>
                    </div>
                    <div class="sequence-container" style="display: none;">
                        <div class="palette-container">
                            <label style="margin: 0; font-weight: bold;">Quick Add / Tools:</label>
                            <div class="palette-buttons">
                                <button type="button" class="btn-lang-swap" title="Swap Language" data-id="${data.id}"><i class="fa-solid fa-language"></i></button>
                                ${paletteButtons}
                            </div>
                        </div>
                    </div>`;

            html += '</div>'; // End main wrapper
            
            list.innerHTML = html;

            var ul = document.createElement('ul');
            ul.setAttribute('id', 'sequence_' + data.id);
            ul.setAttribute('class', 'lyrics');

            // Parse alt_sequence tokens into items
            let tokens = activeSequence.split(',').map(s => s.trim()).filter(Boolean);

            for (let token of tokens) {
                let parsed = SEQUENCE_MAPPER.parseToken(token);
                let rawLyrics = SEQUENCE_MAPPER.getLyricText(data.content, parsed.sectionName, parsed.index);
                
                let formatted_lang1 = rawLyrics.lang1 ? rawLyrics.lang1.split('\n').join('<br />') : '<em>(No lyrics found)</em>';
                let formatted_lang2 = rawLyrics.lang2 ? rawLyrics.lang2.split('\n').join('<br />') : '';

                let list_1 = document.createElement('li');
                list_1.setAttribute('class', 'ui-state-default lyric-item');
                list_1.setAttribute('id', 'song-' + data.id + '_' + token);

                list_1.innerHTML =
                    '<div name="lyrics_parts" class="lyric-content ' + token + ' ' + parsed.sectionName + '">' +
                        '<div class="lyrics_buttons_container">' +
                            '<button type="button" class="btn-lyric btn-lyric-add add_sequence_btn" title="Add Section"><i class="fa-solid fa-plus"></i></button>' +
                            '<button type="button" class="btn-lyric btn-lyric-remove remove_sequence_btn" title="Remove Section"><i class="fa-solid fa-trash"></i></button>' +
                        '</div>' +
                        '<strong>[' + parsed.displayHeader + ']</strong><br/>' +
                        '<div class="text-lang1">' + formatted_lang1 + '</div>' +
                        '<div class="text-lang2" style="display:none;">' + formatted_lang2 + '</div>' +
                    '</div>';

                ul.append(list_1);
            }

            // Trigger the DRY checker to handle the empty state
            checkSequenceEmptyState($(ul));

        var sequenceContainer = list.querySelector('.sequence-container');
        sequenceContainer.appendChild(ul);
    } 
    else if (data.type == 'info') {
        list.innerHTML = '<span class="infotitle" name="' + data.id + '" bible="' + data.bible + '">' + data.notes + '&nbsp;<button class="remove_btn" style="display:none"> - </button></span>';
    }

    return list;
}

// --- Language Swap Button Handler ---
$(document).on('click', '.btn-lang-swap', function() {
    let id = $(this).data('id');
    let $sequenceContainer = $('#sequence_' + id);
    
    let $lang1 = $sequenceContainer.find('.text-lang1');
    let $lang2 = $sequenceContainer.find('.text-lang2');
    
    // Check which language is currently visible and toggle all parts
    if ($lang1.first().is(':visible')) {
        $lang1.hide();
        $lang2.show();
    } else {
        $lang2.hide();
        $lang1.show();
    }
});

// --- Quick Add Palette Button Handler ---
$(document).on('click', '.btn-palette', function() {
    let tag = $(this).data('sec'); 
    let songId = $(this).data('id');
    
    let songData = songs_temp.find(s => s.id == songId);
    if (!songData) return;
    
    let parsed = SEQUENCE_MAPPER.parseToken(tag);
    let rawLyrics = SEQUENCE_MAPPER.getLyricText(songData.content, parsed.sectionName, parsed.index);
    
    let formatted_lang1 = rawLyrics.lang1 ? rawLyrics.lang1.split("\n").join("<br />") : '<em>(No lyrics found)</em>';
    let formatted_lang2 = rawLyrics.lang2 ? rawLyrics.lang2.split("\n").join("<br />") : '';
    
    let isLang2Active = $('#sequence_' + songId).find('.text-lang2').first().is(':visible');

    let newBlock = $(`
        <li class="ui-state-default lyric-item" id="song-${songId}_${tag}">
            <div name="lyrics_parts" class="lyric-content ${tag} ${parsed.sectionName}">
                <div class="lyrics_buttons_container">
                    <button type="button" class="btn-lyric btn-lyric-add add_sequence_btn" title="Add Section"><i class="fa-solid fa-plus"></i></button>
                    <button type="button" class="btn-lyric btn-lyric-remove remove_sequence_btn" title="Remove Section"><i class="fa-solid fa-trash"></i></button>
                </div>
                <strong>[${parsed.displayHeader}]</strong><br/>
                <div class="text-lang1" style="display:${isLang2Active ? 'none' : 'block'};">${formatted_lang1}</div>
                <div class="text-lang2" style="display:${isLang2Active ? 'block' : 'none'};">${formatted_lang2}</div>
            </div>
        </li>
    `);
    
    let $sequenceContainer = $('#sequence_' + songId);

    $sequenceContainer.append(newBlock);
    
    checkSequenceEmptyState($sequenceContainer);
    
    $(".lyrics").sortable("destroy");
    init();
    if (typeof checkActionButtons === 'function') checkActionButtons();
});

function add_song_to_worship(worship_list) {
    worship_list.empty();
    var top_ul = document.createElement('ul');
    top_ul.setAttribute('id', 'songs');
    var i = 0;
    for (data of songs_temp) {
        console.log('data', data);
        var list = generate_song_card(data, i);
        top_ul.append(list);
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
    let url = '/song/' + id + '/edit';
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
                            
                            // Helper function for the refresh logic
                            function updateCardAfterSave() {
                                $("#dialog").dialog("close");

                                // Fetch the newly saved song data from database
                                return get_song(id).done(function(updated_song_data) {
                                    let songIndex = songs_temp.findIndex(s => s.id == id);
                                    
                                    if (songIndex > -1) {
                                        let old_song = songs_temp[songIndex];
                                        
                                        // Preserve the worship-specific data
                                        updated_song_data.transpose = old_song.transpose;
                                        updated_song_data.notes = old_song.notes;
                                        updated_song_data.alt_sequence = old_song.alt_sequence;
                                        updated_song_data.date = old_song.date;

                                        // Update songs_temp
                                        songs_temp[songIndex] = updated_song_data;

                                        // Generate the HTML for JUST this specific card
                                        let new_card_html = generate_song_card(updated_song_data, songIndex);
                                        
                                        $('#worship li[name="' + id + '"]').replaceWith(new_card_html);

                                        init();
                                    }
                                });
                            }

                            submit_song(click_url, JSON.stringify(tempSubmit))
                                .done(function(response) {
                                    console.log("Saved successfully with JSON response:", response);
                                    updateCardAfterSave().done(function() {
                                        $(document).trigger('worshipUIUpdated');
                                    });
                                })
                                .fail(function(jqXHR, textStatus, errorThrown) {
                                    // Check if it actually succeeded but just failed the JSON parse
                                    if (jqXHR.status === 200) {
                                        console.log("Saved successfully (plain text response).");
                                        updateCardAfterSave().done(function() {
                                            $(document).trigger('worshipUIUpdated');
                                        });
                                    } else {
                                        console.error("AJAX Error:", textStatus, errorThrown);
                                        alert("Failed to save changes. Please try again.");
                                    }
                                });
                                
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
function get_links(video, score, abc, id) {
    let html = '';

    if (Array.isArray(score) && score.length > 0) {
        if (score.length === 1) {
            html += `<a href="${score[0]}" target="_blank"><i style="font-size:24px" class="fa" title="Sheet Music">&#xf0f6;</i></a>`;
        } else {
            html += `<div class="media-dropdown">
                <span class="media-dropbtn"><i class="fa" style="font-size:24px" title="Sheet Music">&#xf0f6;</i><span class="badge">${score.length}</span></span>
                <div class="media-dropdown-content">`;
            score.forEach((link, idx) => { html += `<a href="${link}" target="_blank">Sheet Music ${idx + 1}</a>`; });
            html += `</div></div>`;
        }
    }

    if (Array.isArray(abc) && abc.length > 0 && id) {
        html += `<a href="/worship/sheets/${id}" target="_blank"><i style="font-size:24px" class="fa" title="Interactive Sheet Music">&#xf1c7;</i></a>`;
    }

    if (Array.isArray(video) && video.length > 0) {
        if (video.length === 1) {
            html += `<a href="${video[0]}" target="_blank"><i class="fa fa-play-circle" style="font-size:24px" title="Youtube Video"></i></a>`;
        } else {
            html += `<div class="media-dropdown">
                <span class="media-dropbtn"><i class="fa fa-play-circle" style="font-size:24px" title="Youtube Videos"></i><span class="badge">${video.length}</span></span>
                <div class="media-dropdown-content">`;
            video.forEach((link, idx) => { html += `<a href="${link}" target="_blank">Video ${idx + 1}</a>`; });
            html += `</div></div>`;
        }
    }
    
    return html ? `<span class="media-icons-wrapper">${html}</span>` : '';
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
