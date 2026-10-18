import copy
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from app import tools
from web import index


def song(song_id, text=None):
    return {
        'id': song_id, 'type': 'song', 'title': f'Song {song_id}',
        'date': '2026-10-18', 'notes': '',
        'content': [{'name': 'v1', 'origin_text': text or f'Lyrics {song_id}'}],
    }


def arranged_song(slide):
    return slide['type'] == 'song' and slide['id'] != -1


class SlideRefreshTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        (root / 'files').mkdir()
        shutil.copyfile(Path(tools.__file__).parents[1] / 'files/template.json',
                        root / 'files/template.json')
        self.selection = [song(1), song(2)]
        patches = [
            patch.object(tools, '__file__', str(root / 'app/tools.py')),
            patch.object(tools.Utils, 'get_worship_date', return_value=('2026-10-18',)),
            patch.object(tools.Utils, 'get_worship_songs',
                         side_effect=lambda _: copy.deepcopy(self.selection)),
            patch.object(tools.Utils, 'get_worship', return_value={'sermons': {}}),
            patch.object(tools.Utils, 'get_info', return_value=[]),
            patch.object(tools.Utils, 'get_worship_id', return_value=(1,)),
            patch.object(index, '__get_sundays', return_value={'sunday': '2026-10-18'}),
            patch.object(index, 'slides_data', copy.deepcopy(index.slides_data)),
            patch.object(index, 'client', {'admin': [], 'lead': [], 'musician': [], 'view': []}),
            patch.object(index, 'client_mode', ''),
        ]
        for replacement in patches:
            replacement.start()
            self.addCleanup(replacement.stop)
        self.http = index.app.test_client()
        self.socket = index.socketio.test_client(index.app)
        self.addCleanup(self.socket.disconnect)
        self.refresh()

    def refresh(self):
        # The same regenerate + broadcast requests used by Refresh Slide.
        response = self.http.get('/API/worship/1/edit')
        self.assertEqual(response.status_code, 200)
        self.socket.emit('reload')
        events = [event for event in self.socket.get_received() if event['name'] == 'reload']
        self.assertEqual(len(events), 1)
        self.presentation = events[0]['args'][0]
        return [slide for slide in self.presentation['data'] if arranged_song(slide)]

    def test_reorder_uses_configurator_order_and_keeps_styles(self):
        saved = tools.get_worship_json(1)
        old_song = next(s for s in saved['slides'] if s['id'] == 1)
        old_song['style']['background'] = 'custom.jpg'
        tools.create_json(1, saved)
        non_songs = [s['title'] for s in saved['slides'] if not arranged_song(s)]
        self.selection.reverse()
        refreshed = self.refresh()
        self.assertEqual([s['id'] for s in refreshed], [2, 1])
        self.assertEqual(refreshed[1]['style']['background'], 'custom.jpg')
        self.assertEqual([s['title'] for s in self.presentation['data'] if not arranged_song(s)], non_songs)
        self.assertEqual([s['id'] for s in tools.get_worship_json(1)['slides'] if arranged_song(s)], [2, 1])

    def test_replace_and_update_content(self):
        self.selection = [song(3), song(1, 'Updated verse')]
        self.selection[1]['notes'] = 'Updated notes'
        refreshed = self.refresh()
        self.assertEqual([s['id'] for s in refreshed], [3, 1])
        self.assertEqual(refreshed[1]['content'][0]['origin_text'], 'Updated verse')
        self.assertEqual(refreshed[1]['notes'], 'Updated notes')

    def test_add_remove_and_empty_selection(self):
        for ids in ([2, 3, 1], [3], [], [4, 2]):
            with self.subTest(ids=ids):
                self.selection = [song(i) for i in ids]
                self.assertEqual([s['id'] for s in self.refresh()], ids)

    def test_duplicate_song_occurrences_follow_arrangement(self):
        self.selection = [song(2, 'First'), song(1), song(2, 'Second')]
        refreshed = self.refresh()
        self.assertEqual([s['id'] for s in refreshed], [2, 1, 2])
        self.assertEqual([refreshed[0]['content'][0]['origin_text'],
                          refreshed[2]['content'][0]['origin_text']], ['First', 'Second'])

    def test_service_slides_keep_their_placement_between_song_slots(self):
        welcome = {'id': -1, 'type': 'info', 'title': 'Welcome'}
        sermon = {'id': -1, 'type': 'info', 'title': 'Sermon'}
        offering = {'id': -1, 'type': 'song', 'title': 'Offering'}
        previous = [welcome, song(1), sermon, song(2), offering]
        generated = [welcome, song(3), song(2), song(1), sermon, offering]
        ordered = tools._preserve_slide_order(generated, previous)
        self.assertEqual([s['title'] for s in ordered],
                         ['Welcome', 'Song 3', 'Sermon', 'Song 2', 'Song 1', 'Offering'])


if __name__ == '__main__':
    unittest.main()
