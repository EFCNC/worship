import sqlite3
from pathlib import Path


def _normalize_lang(lang: str | None) -> str:
    if not lang:
        return 'zh'
    lang = str(lang).strip().lower()
    if lang.startswith('zh'):
        return 'zh'
    if lang.startswith('en'):
        return 'en'
    return 'zh'


def _get_default_language(row: sqlite3.Row) -> str:
    legacy_lang = _normalize_lang(row['lang'])
    has_values = any(
        (row['title'] or '').strip() or
        (row['speaker'] or '').strip() or
        (row['bible_verse'] or '').strip() or
        (row['outline'] or '').strip()
        for _ in [0]
    )
    if legacy_lang == 'en':
        return 'en'
    if legacy_lang == 'zh':
        return 'zh'
    return 'zh' if has_values else 'en'


def migrate_sermon_schema(db_path: str | None = None) -> None:
    db_file = Path(db_path or 'db/worship.db')
    if not db_file.exists():
        raise FileNotFoundError(f"Database not found: {db_file}")

    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print(f"Migrating {db_file}")

    cur.execute('DROP TABLE IF EXISTS sermon_old')
    cur.execute('ALTER TABLE sermon RENAME TO sermon_old')

    cur.execute('''
        CREATE TABLE sermon (
            id INTEGER PRIMARY KEY,
            sermon_id INTEGER NOT NULL,
            lang TEXT NOT NULL,
            title TEXT,
            speaker TEXT,
            bible TEXT,
            outline TEXT,
            is_joint INTEGER DEFAULT 0,
            keyword TEXT,
            updated TEXT DEFAULT CURRENT_TIMESTAMP,
            date TEXT
        )
    ''')

    rows = cur.execute('''
        SELECT sermon_id, title, speaker, bible_verse, keyword, outline, lang, updated, date
        FROM sermon_old
    ''').fetchall()

    for row in rows:
        sermon_id = row['sermon_id']
        populated_lang = _get_default_language(row)

        for target_lang in ['en', 'zh']:
            if target_lang == populated_lang:
                title = row['title'] or ''
                speaker = row['speaker'] or ''
                bible = row['bible_verse'] or ''
                outline = row['outline'] or ''
            else:
                title = ''
                speaker = ''
                bible = ''
                outline = ''

            cur.execute('''
                INSERT INTO sermon (
                    sermon_id, lang, title, speaker, bible, outline, is_joint, keyword, updated, date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                sermon_id,
                target_lang,
                title,
                speaker,
                bible,
                outline,
                0,
                row['keyword'] or '',
                row['updated'] or '',
                row['date'] or '',
            ))

    cur.execute('DROP TABLE sermon_old')
    conn.commit()
    print('Migration complete')
    conn.close()


if __name__ == '__main__':
    migrate_sermon_schema()
