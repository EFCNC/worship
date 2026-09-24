const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = process.env.WORSHIP_ROOT || path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'web/templates/slides/slides_admin.html'), 'utf8');
const script = template.split('{% block extra_js %}')[1].split('<script>')[1].split('</script>')[0];
const presentationScript = fs.readFileSync(path.join(root, 'web/static/js/presentation.js'), 'utf8');
const brightnessFunctions = presentationScript.slice(
    presentationScript.indexOf('    function get_slide_background_brightness('),
    presentationScript.indexOf('    function load_slides('));
const presentation = {
    data: [
        { style: { background: 'first.png', brightness: 0.8, opacity: 1 } },
        { style: { background: 'second.png', brightness: 0.5, opacity: 1 } },
    ],
    setting: {}, pos: [0, 0], background: [], id: 42,
};

function editor() {
    const elements = new Map();
    const handlers = new Map();
    let ready;
    let slider;
    // Reveal uses separate horizontal image and vertical page/media layers.
    const backgrounds = presentation.data.map(slide => ({
        style: {}, children: [{ style: { backgroundImage: `url("${slide.style.background}")` } }],
        pages: [{ style: {}, children: [{ style: {} }] }, { style: {}, children: [{ style: {} }] }],
    }));
    const preview = backgrounds[0].children[0];
    const saves = [];
    function $(selector) {
        if (!elements.has(selector)) {
            const element = {
                visible: false,
                show() { this.visible = true; return this; },
                hide() { this.visible = false; return this; },
                toggle() { this.visible = !this.visible; return this; },
                is() { return this.visible; },
                hasClass() { return selector === '#slider'; },
                text(value) { this.value = value; return this; },
                ready(callback) { ready = callback; return this; },
                on(event, target, callback) { handlers.set(`${event}:${target}`, callback); return this; },
                click() { return this; },
                slider(options, key, value) {
                    if (typeof options === 'object') slider = options;
                    else this.value = value;
                    return this;
                },
            };
            for (const name of ['attr', 'prop', 'each', 'toggleClass', 'stop', 'fadeIn', 'fadeOut', 'empty', 'html']) {
                element[name] = () => element;
            }
            elements.set(selector, element);
        }
        return elements.get(selector);
    }
    $.ajax = () => ({});
    $.when = () => ({ then(callback) { callback([]); } });
    const context = vm.createContext({
        $, document: {
            querySelector(selector) {
                const index = Number(selector.match(/nth-child\((\d+)\)/)[1]) - 1;
                return { children: backgrounds[index].pages.map(() => ({ tagName: 'SECTION' })) };
            },
        }, console, setTimeout: () => 1, clearTimeout() {},
        load_slides() {},
        Reveal: {
            on() {}, initialize() {},
            getSlide: h => ({ children: backgrounds[h].pages.map(() => ({ tagName: 'SECTION' })) }),
            getSlideBackground: (h, v) => v === undefined ? backgrounds[h] : backgrounds[h].pages[v],
        },
        update_json(download, callbacks) {
            saves.push(JSON.parse(JSON.stringify(context.slides)));
            callbacks?.success?.();
        },
    });
    vm.runInContext(brightnessFunctions, context);
    vm.runInContext(script.replace('{{ presentation|tojson }}', JSON.stringify(presentation)), context);
    ready();
    context.show_background();
    return {
        context, saves, preview, backgrounds,
        controlsVisible: () => $('#edit_btn').visible,
        sliderValue: () => $('#custom-handle').value,
        brightness(value) { slider.slide({}, { value }); },
        image(url) { handlers.get('click:#image_icons img').call({ title: url }); },
    };
}

test('brightness previews reveal confirmation controls; cancel restores without saving', () => {
    const ui = editor();
    assert.equal(ui.controlsVisible(), false);
    ui.brightness(3);
    assert.equal(ui.controlsVisible(), true);
    assert.equal(ui.preview.style.filter, 'brightness(0.3)');
    assert.equal(ui.context.slides[0].style.brightness, 0.8);
    ui.context.cancel();
    assert.equal(ui.controlsVisible(), false);
    assert.equal(ui.preview.style.filter, 'brightness(0.8)');
    assert.equal(ui.sliderValue(), 8);
    assert.equal(ui.saves.length, 0);
});

test('apply saves brightness for only the selected slide', () => {
    const ui = editor();
    ui.brightness(3);
    ui.context.apply('one');
    assert.equal(ui.controlsVisible(), false);
    assert.deepEqual(ui.saves[0].map(slide => slide.style.brightness), [0.3, 0.5]);
    assert.deepEqual(ui.saves[0].map(slide => slide.style.background), ['first.png', 'second.png']);
    // A second adjustment must enter confirmation mode after apply reset it.
    ui.brightness(6);
    assert.equal(ui.controlsVisible(), true);
    ui.context.cancel();
    assert.equal(ui.preview.style.filter, 'brightness(0.3)');
    assert.equal(ui.saves.length, 1);
});

test('brightness apply-all saves every brightness without replacing distinct images', () => {
    const ui = editor();
    ui.brightness(0);
    ui.context.apply('all');
    assert.deepEqual(ui.saves[0].map(slide => slide.style.brightness), [0, 0]);
    assert.deepEqual(ui.saves[0].map(slide => slide.style.background), ['first.png', 'second.png']);
});

test('image and brightness apply-all still saves both changes', () => {
    const ui = editor();
    ui.image('new.png');
    ui.brightness(4);
    ui.context.apply('all');
    assert.deepEqual(ui.saves[0].map(slide => slide.style.brightness), [0.4, 0.4]);
    assert.deepEqual(ui.saves[0].map(slide => slide.style.background), ['new.png', 'new.png']);
});

test('an applied or cancelled image does not leak into a later brightness-only apply-all', () => {
    for (const action of ['apply', 'cancel']) {
        const ui = editor();
        ui.image('new.png');
        if (action === 'apply') ui.context.apply('one');
        else ui.context.cancel();
        ui.brightness(6);
        ui.context.apply('all');
        assert.deepEqual(ui.saves.at(-1).map(slide => slide.style.background),
                         [action === 'apply' ? 'new.png' : 'first.png', 'second.png']);
        assert.deepEqual(ui.saves.at(-1).map(slide => slide.style.brightness), [0.6, 0.6]);
    }
});

test('saved brightness reaches horizontal images and vertical media without filtering wrappers', () => {
    const ui = editor();
    ui.context.apply_background_brightness();
    ui.backgrounds.forEach((background, index) => {
        const expected = `brightness(${presentation.data[index].style.brightness})`;
        assert.equal(background.children[0].style.filter, expected);
        assert.equal(background.style.filter, undefined);
        background.pages.forEach(page => {
            assert.equal(page.children[0].style.filter, expected);
            assert.equal(page.style.filter, undefined);
        });
    });
});

test('preview and cancel update the shared column image instead of adding a subpage image', () => {
    const ui = editor();
    ui.image('new.png');
    ui.brightness(2);
    assert.equal(ui.preview.style.backgroundImage, 'url("new.png")');
    assert.equal(ui.preview.style.filter, 'brightness(0.2)');
    ui.context.cancel();
    assert.equal(ui.preview.style.backgroundImage, 'url("first.png")');
    assert.equal(ui.preview.style.filter, 'brightness(0.8)');
    ui.backgrounds[0].pages.forEach(page => {
        assert.equal(page.children[0].style.backgroundImage, undefined);
        assert.equal(page.children[0].style.filter, 'brightness(0.8)');
    });
});
