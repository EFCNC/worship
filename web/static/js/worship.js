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

const SEQUENCE_MAPPER = SongSequence;

function get_language_version_order(data) {
    const languages = get_language_codes(data.lang);
    const weeklyOrder = get_language_codes(data.language_version_order);
    const order = weeklyOrder.length
        ? weeklyOrder.filter(lang => languages.includes(lang))
        : languages.slice(0, 2);
    return order;
}

function get_language_codes(languages) {
    const values = Array.isArray(languages)
        ? languages
        : (typeof languages === 'string' ? languages.split(',') : []);
    return [...new Set(values.map(lang => String(lang).trim()).filter(Boolean))];
}

function language_tags(languages) {
    return get_language_codes(languages).map(lang_tag).join(' ');
}

function render_song_sequence_language(song, language) {
    const $sequence = $('#sequence_' + song.id);
    if (!$sequence.length || !language) return;

    $sequence.children('.lyric-item').each(function() {
        const token = this.id.slice(('song-' + song.id + '_').length);
        const parsed = SEQUENCE_MAPPER.parseToken(token);
        const rawLyrics = SEQUENCE_MAPPER.getLyricText(
            song.content,
            parsed.sectionName,
            parsed.index,
            language,
            ''
        );
        const lyrics = rawLyrics.lang1
            ? rawLyrics.lang1.split('\n').join('<br />')
            : '<em>(No lyrics found)</em>';
        $(this).find('.text-lang1').html(lyrics).show();
        $(this).find('.text-lang2').hide();
    });

    $sequence.attr('data-current-language', language);
}

// Helper function to build a single song <li>
function generate_song_card(data, index) {
    var list = document.createElement('li');
    list.setAttribute('class', 'ui-state-default');
    list.setAttribute('name', data.id);

    if (data.type == 'song') {
        var activeSequence = data.alt_sequence || '';
        var languageOrder = get_language_version_order(data);
        var primaryLanguage = languageOrder[0] || '';
        var secondaryLanguage = languageOrder[1] || '';
        var songLanguageOrder = get_language_codes(data.lang);
        var songPrimaryLanguage = songLanguageOrder[0] || '';
        var songLanguageTags = language_tags(songLanguageOrder);
        var unusedLanguages = songLanguageOrder.filter(lang => !languageOrder.includes(lang));
        var activeLanguageItems = languageOrder.map((lang, index) => `
            <li class="language-priority-item" data-lang="${lang}">
                <span class="language-priority-handle" title="Drag to change priority"><i class="fa-solid fa-grip-lines"></i></span>
                <span class="language-priority-name">${lang}<small>(#${index + 1})</small></span>
                <button type="button" class="language-priority-move" title="Move to unused languages" aria-label="Remove ${lang} from priority"><i class="fa-solid fa-arrow-right"></i><span>Remove</span></button>
            </li>
        `).join('');
        var unusedLanguageItems = unusedLanguages.map(lang => `
            <li class="language-priority-item" data-lang="${lang}">
                <span class="language-priority-handle" title="Drag to change priority"><i class="fa-solid fa-grip-lines"></i></span>
                <span class="language-priority-name">${lang}</span>
                <button type="button" class="language-priority-move" title="Add ${lang} to current languages" aria-label="Add ${lang} to current languages"><i class="fa-solid fa-arrow-left"></i><span>Add</span></button>
            </li>
        `).join('');

        var html = '<div class="song-content-wrapper">';

            // Row 1: Title, Metadata, Delete Button
            html += '<div class="song-header-row">';
            html += '<span class="song-title" name="' + data.id + '" lang="' + songPrimaryLanguage + '">';
            html += '<b>' + data.title + '</b>&nbsp;' + songLanguageTags + ' Author: ' + data.author;
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

            html += `
                <div class="language-priority-widget" data-song-id="${data.id}">
                    <button type="button" class="language-priority-toggle" aria-expanded="false">
                        <i class="fa-solid fa-caret-right"></i>
                        <span>Languages</span>
                        <small>${languageOrder.join(', ')}</small>
                    </button>
                    <div class="language-priority-panel" style="display: none;">
                        <div class="language-priority-box">
                            <strong>Current Languages</strong>
                            <ul class="language-priority-list language-priority-active" data-empty="No current languages">${activeLanguageItems}</ul>
                        </div>
                        <div class="language-priority-box">
                            <strong>Unused Languages</strong>
                            <ul class="language-priority-list" data-empty="No unused languages">${unusedLanguageItems}</ul>
                        </div>
                    </div>
                </div>`;

            // Row 3: Notes
            html += `
                <div class="song-notes-row">
                    <div class="notes-container" style="width: 100%;">
                        <label for="song-notes-${index}" style="display: block; margin-bottom: 5px; font-weight: bold;">Song Notes:</label>
                        <textarea id="song-notes-${index}" name="song_notes" data-index="${index}" rows="2">${data.notes || ''}</textarea>
                    </div>
                </div>`;

            // Sequence Palette Buttons
            let paletteButtons = '';
            if (Array.isArray(data.content)) {
                let primaryContent = data.content.find(c => c.lang === primaryLanguage) || data.content[0];
                if (primaryContent && Array.isArray(primaryContent.lyrics)) {
                    primaryContent.lyrics.forEach(c => {
                        let textSource = c.lyrics_text || c.lyrics; 
                        if (!textSource) return; 
                        
                        let count = Array.isArray(textSource) ? textSource.length : 1;
                        
                        for (let i = 0; i < count; i++) {
                            let tag = SEQUENCE_MAPPER.getShortTag(c.name, i, count);
                            paletteButtons += `<button type="button" class="btn-palette ${c.name}" data-sec="${tag}" data-id="${data.id}">[${tag}]</button>`;
                        }
                    });
                }
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
                                <button type="button" class="btn-lang-swap" title="Swap Language" data-id="${data.id}"${languageOrder.length > 1 ? '' : ' style="display: none;"'}><i class="fa-solid fa-language"></i></button>
                                ${paletteButtons}
                            </div>
                        </div>
                    </div>`;

            html += '</div>'; // End main wrapper
            
            list.innerHTML = html;

            var ul = document.createElement('ul');
            ul.setAttribute('id', 'sequence_' + data.id);
            ul.setAttribute('class', 'lyrics');
            ul.setAttribute('data-current-language', primaryLanguage);

            // Parse alt_sequence tokens into items
            let tokens = activeSequence.split(',').map(s => s.trim()).filter(Boolean);

            for (let token of tokens) {
                let parsed = SEQUENCE_MAPPER.parseToken(token);
                let rawLyrics = SEQUENCE_MAPPER.getLyricText(data.content, parsed.sectionName, parsed.index, primaryLanguage, secondaryLanguage);
                
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
    let song = songs_temp.find(item => item.id == id);
    if (!song) return;

    const languageOrder = get_language_version_order(song);
    if (languageOrder.length < 2) return;

    const $sequence = $('#sequence_' + id);
    const currentLanguage = $sequence.attr('data-current-language');
    const currentIndex = languageOrder.indexOf(currentLanguage);
    const nextLanguage = languageOrder[(currentIndex + 1) % languageOrder.length];
    render_song_sequence_language(song, nextLanguage);
});

// --- Quick Add Palette Button Handler ---
$(document).on('click', '.btn-palette', function() {
    let tag = $(this).data('sec'); 
    let songId = $(this).data('id');
    
    let songData = songs_temp.find(s => s.id == songId);
    if (!songData) return;
    
    let parsed = SEQUENCE_MAPPER.parseToken(tag);
    let languageOrder = get_language_version_order(songData);
    let $sequenceContainer = $('#sequence_' + songId);
    let currentLanguage = $sequenceContainer.attr('data-current-language') || languageOrder[0] || '';
    let rawLyrics = SEQUENCE_MAPPER.getLyricText(songData.content, parsed.sectionName, parsed.index, currentLanguage, '');
    
    let formatted_lang1 = rawLyrics.lang1 ? rawLyrics.lang1.split("\n").join("<br />") : '<em>(No lyrics found)</em>';
    let newBlock = $(`
        <li class="ui-state-default lyric-item" id="song-${songId}_${tag}">
            <div name="lyrics_parts" class="lyric-content ${tag} ${parsed.sectionName}">
                <div class="lyrics_buttons_container">
                    <button type="button" class="btn-lyric btn-lyric-add add_sequence_btn" title="Add Section"><i class="fa-solid fa-plus"></i></button>
                    <button type="button" class="btn-lyric btn-lyric-remove remove_sequence_btn" title="Remove Section"><i class="fa-solid fa-trash"></i></button>
                </div>
                <strong>[${parsed.displayHeader}]</strong><br/>
                <div class="text-lang1">${formatted_lang1}</div>
                <div class="text-lang2" style="display:none;"></div>
            </div>
        </li>
    `);
    
    $sequenceContainer.append(newBlock);
    
    checkSequenceEmptyState($sequenceContainer);$(".lyrics").sortable("destroy");
    init();
    if (typeof checkActionButtons === 'function') checkActionButtons();
});

function add_song_to_worship(worship_list) {
    worship_list.empty();
    var top_ul = document.createElement('ul');
    top_ul.setAttribute('id', 'songs');
    var i = 0;
    for (let data of songs_temp) {
        var list = generate_song_card(data, i);
        top_ul.append(list);
        i++;
    }
    worship_list.append(top_ul);
    return;
}

// Validate form values
function validate_form(data) {
    // Sequence cannot be empty
    if (!data.sequence || data.sequence.trim() === '') {
        alert("Sequence needs a value!");
        return false;
    }

    if (!Array.isArray(data.content) || data.content.length === 0) {
        alert("Are there... lyrics? The editor seems empty.");
        return false;
    }

    for (const token of data.sequence.split(',').map(value => value.trim()).filter(Boolean)) {
        const { sectionName, index } = SEQUENCE_MAPPER.parseToken(token);
        const hasLyrics = data.content.some(language => {
            const section = SEQUENCE_MAPPER.findSection(language, sectionName);
            return section?.lyrics?.[index]?.trim();
        });

        if (!hasLyrics) {
            alert(`No lyrics found for "${token}" in either language.`);
            return false;
        }
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
    let temp = [];
    for (let i of form_data) {
        let find = map2.find(o=> o.value != i.value && o.name == i.name)
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
                                        updated_song_data.language_version_order = old_song.language_version_order || get_language_version_order(updated_song_data);

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
                                data.language_version_order = get_language_version_order(data);
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
