import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from flask import Flask

from app import tools as Tools
from web.api import api


class SlideRefreshTests(unittest.TestCase):
    def setUp(self):
        template = Path(Tools.__file__).resolve().parents[1] / 'files' / 'template.json'
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        (self.root / 'files').mkdir()
        (self.root / 'files' / 'template.json').write_bytes(template.read_bytes())
        self.enterContext(patch.object(Tools, '__file__', str(self.root / 'app' / 'tools.py')))
        self.songs = self.enterContext(patch.object(Tools.Utils, 'get_worship_songs', return_value=[]))
        self.enterContext(patch.object(Tools.Utils, 'get_worship_date', return_value=['2026-09-27']))
        self.sermon = self.enterContext(patch.object(Tools.Utils, 'get_worship', return_value={
            'sermons': {'zh': {'title': 'Original sermon'}}
        }))
        self.info = self.enterContext(patch.object(Tools.Utils, 'get_info', return_value=[
            {'type': 'announcement', 'info': 'Original announcement'}
        ]))
        app = Flask(__name__)
        app.register_blueprint(api, url_prefix='/API')
        self.client = app.test_client()

    def refresh(self):
        response = self.client.get('/API/worship/42/edit')
        self.assertEqual(response.status_code, 200)
        return self.client.get('/API/worship/42/json').get_json()

    def save(self, presentation):
        response = self.client.post('/API/worship/42/json', json=presentation)
        self.assertEqual(response.status_code, 200)

    def page(self, name='Custom Page', manual=True):
        return {'name': name, 'origin_text': '中文', 'region_text': 'English', 'manual': manual}

    def song(self, song_id, title):
        return {'id': song_id, 'type': 'song', 'title': title, 'date': '2026-09-27',
                'content': [self.page('Verse', False), self.page('Chorus', False)]}

    def test_custom_columns_media_and_information_subpages_survive_refresh(self):
        original = self.refresh()
        announcement = next(s for s in original['slides'] if s['title'] == '報告')
        announcement['content'] = [dict(announcement['content'], name='Information'), self.page()]
        custom = {'id': -1, 'type': 'info', 'title': 'Custom',
                  'content': [self.page()], 'style': {'fragment': 0}}
        media = {'id': -1, 'type': 'media', 'title': 'Media',
                 'content': {'origin_text': 'https://example.com', 'region_text': ''},
                 'style': {'fragment': 0}}
        original['slides'][2:2] = [custom, copy.deepcopy(custom), media]
        original['setting']['assets'] = ['saved-image.png']
        self.save(original)
        self.info.return_value = [{'type': 'announcement', 'info': 'Updated announcement'}]
        self.sermon.return_value = {'sermons': {'zh': {'title': 'Updated sermon'}}}
        for _ in range(2):
            refreshed = self.refresh()
            self.assertEqual([s['title'] for s in refreshed['slides']],
                             [s['title'] for s in original['slides']])
            self.assertEqual(refreshed['slides'][2:5], original['slides'][2:5])
            pages = next(s['content'] for s in refreshed['slides'] if s['title'] == '報告')
            self.assertIn('Updated announcement', pages[0]['origin_text'])
            self.assertEqual(pages[1:], [self.page()])
            sermon = next(s for s in refreshed['slides'] if s['title'] == '主日信息')
            self.assertIn('Updated sermon', sermon['content']['origin_text'])
            self.assertEqual(refreshed['setting']['assets'], ['saved-image.png'])

    def test_song_subpages_survive_but_removed_database_songs_do_not(self):
        self.songs.side_effect = lambda _: [self.song(101, 'First'), self.song(102, 'Second')]
        original = self.refresh()
        song = next(s for s in original['slides'] if s['id'] == 101)
        song['content'].insert(1, self.page())
        song['style']['background'] = 'custom.png'
        self.save(original)
        updated_song = self.song(101, 'First')
        updated_song['content'][0]['origin_text'] = 'Updated lyrics'
        self.songs.side_effect = lambda _: [copy.deepcopy(updated_song)]
        for _ in range(2):
            refreshed = self.refresh()
            song = next(s for s in refreshed['slides'] if s['id'] == 101)
            self.assertEqual([p['name'] for p in song['content']], ['Verse', 'Custom Page', 'Chorus'])
            self.assertEqual(song['content'][0]['origin_text'], 'Updated lyrics')
            self.assertEqual(song['content'][1], self.page())
            self.assertEqual(song['style']['background'], 'custom.png')
            self.assertNotIn(102, [s['id'] for s in refreshed['slides']])

    def test_custom_column_with_template_title_is_preserved(self):
        original = self.refresh()
        custom = {'id': -1, 'type': 'info', 'title': '報告', 'manual': True,
                  'content': [self.page()], 'style': {'fragment': 0}}
        original['slides'].insert(0, custom)
        self.save(original)
        refreshed = self.refresh()
        self.assertEqual(refreshed['slides'][0], custom)
        self.assertEqual(len(refreshed['slides']), len(original['slides']))

    def test_manual_pages_on_static_slides_are_not_duplicated(self):
        original = self.refresh()
        offering = next(s for s in original['slides'] if s['title'] == '奉獻歌')
        offering['content'].insert(0, self.page())
        original['slides'].remove(offering)
        original['slides'].insert(0, offering)
        self.save(original)
        for _ in range(2):
            refreshed = self.refresh()
            self.assertEqual(refreshed['slides'][0], offering)

    def test_new_songs_in_song_free_week_go_between_announcements_and_sermon(self):
        original = self.refresh()
        self.songs.side_effect = lambda _: [self.song(101, 'First'), self.song(102, 'Second')]
        expected = [s['title'] for s in original['slides']]
        sermon_index = expected.index('主日信息')
        expected[sermon_index:sermon_index] = ['First', 'Second']
        for _ in range(2):
            refreshed = self.refresh()
            self.assertEqual([s['title'] for s in refreshed['slides']], expected)

    def test_new_songs_use_plan_order_around_existing_songs(self):
        self.songs.side_effect = lambda _: [self.song(102, 'Second')]
        original = self.refresh()
        self.songs.side_effect = lambda _: [self.song(101, 'First'), self.song(102, 'Second'),
                                           self.song(103, 'Third')]
        refreshed = self.refresh()
        titles = [s['title'] for s in refreshed['slides']]
        self.assertEqual(titles[titles.index('報告') + 1:titles.index('主日信息')],
                         ['First', 'Second', 'Third'])

    def test_adding_songs_preserves_custom_and_reordered_columns(self):
        original = self.refresh()
        custom = {'id': -1, 'type': 'info', 'title': 'Custom',
                  'content': [self.page()], 'style': {'fragment': 0}}
        original['slides'].insert(2, custom)
        # Keep an intentional order change outside the song insertion point.
        original['slides'][-2:] = reversed(original['slides'][-2:])
        self.save(original)
        self.songs.side_effect = lambda _: [self.song(101, 'First')]
        refreshed = self.refresh()
        titles = [s['title'] for s in refreshed['slides']]
        self.assertEqual([t for t in titles if t != 'First'],
                         [s['title'] for s in original['slides']])
        self.assertLess(titles.index('報告'), titles.index('First'))
        self.assertLess(titles.index('First'), titles.index('主日信息'))

    def test_confirmed_brightness_survives_refresh_for_all_slide_types(self):
        self.songs.side_effect = lambda _: [self.song(101, 'First')]
        presentation = self.refresh()
        presentation['slides'].append({
            'id': -1, 'type': 'info', 'title': 'Custom', 'manual': True,
            'content': [self.page()], 'style': {'fragment': 0}
        })
        for index, slide in enumerate(presentation['slides']):
            slide['style'].update(brightness=index / 10, opacity=1, background=f'{index}.png')
        expected_styles = [slide['style'] for slide in presentation['slides']]
        self.save(presentation)
        for _ in range(2):
            refreshed = self.refresh()
            self.assertEqual([slide['style'] for slide in refreshed['slides']], expected_styles)


if __name__ == '__main__':
    unittest.main()
