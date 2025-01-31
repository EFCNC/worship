/*
    presentation.js: control worship slides
    param: target div
*/
    // Store worship set into object

    let presentation;
    let pos = 0;
    let order = 0;
    let mode = 0;

    if (document.addEventListener) {
        document.addEventListener('fullscreenchange', exitHandler, false);
        document.addEventListener('mozfullscreenchange', exitHandler, false);
        document.addEventListener('MSFullscreenChange', exitHandler, false);
        document.addEventListener('webkitfullscreenchange', exitHandler, false);
    }

    function exitHandler() {
        if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
            $('#preview').hide();
        }
    }

    function move(type, num) {
        if (type == 0) {
            pos = pos + num;
            pos = pos<0 ? 0:pos;
            pos = pos>=presentation.length ? pos--:pos;
            order = 0;
        }
        else {
            order = order + num;
            order = order<0 ? 0:order;
            order = order>=presentation[pos].content.length? order--:order;
        }
        load($('#preview'));
    }

    function load(elm) {
        var set = document.createElement('div');
        set.setAttribute('name', pos);
        data = presentation[pos];
        var slide = document.createElement('div');
        if (data.type == 's') {
            slide.setAttribute('name', pos);
            slide.setAttribute('class', 'content');
            slide.innerHTML = '<span class="title"><b>' + data.title + '</b></span>';
            l = data.content[order];
            if (mode==0) {
                slide.innerHTML += '<div class="lyrics_part origin 1" name="' + l.name + '">' + l.origin_text.split("\n").join("<br />") + '</div>';
                //slide.innerHTML += '<div class="line" name="' + l.name + '">' + l.origin_chord + '</div>';
            }
            else if (mode==1) {
            console.log(l)
                slide.innerHTML += '<div class="line" name="' + l.name + '">' + l.origin_chord.replace("\n", "<br/>") + '</div>';
            }
            if (l.region) {
                slide.innerHTML += '<div class="lyrics_part region 1" name="' + l.name + '">' + l.region_text.split("\n").join("<br />") + '</div>';
            }
        }
        else {
        console.log(data.notes);
            slide.innerHTML += '<div class="notes_part">' + data.notes + '</div>';
        }
        set.append(slide);
        elm.empty();
        elm.append(set);
        elm.show('Clip', 'slow');
    }

    // Events listener

    $(document).on('keyup',function(e) {
        var code = e.keyCode || e.which;
        // left=37, previous set; up=38, previous slide; right=39, next set; space=32, next slide; down=40, next slide; m=109, switch mode; enter=13, next slide; c=67, show chord
        key_code = [13, 32, 37, 38, 39, 40, 67, 109];
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
                case 67:
                    mode = mode==0?1:0;
                    load($('#preview'));
                    break;
                case 109:
                    switch_mode();
                    break;
            }
        }
        return false;
    });
