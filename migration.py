import sqlite3
from pathlib import Path


def migrate_sermon_schema(db_path: str | None = None) -> None:
    db_file = Path(db_path or 'db/worship.db')
    if not db_file.exists():
        raise FileNotFoundError(f"Database not found: {db_file}")

    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print(f"Migrating {db_file}")

    cols = [row[1] for row in cur.execute('PRAGMA table_info(sermon)')]
    needed = {
        'title_en': 'TEXT',
        'title_zh': 'TEXT',
        'speaker_en': 'TEXT',
        'speaker_zh': 'TEXT',
        'verse_en': 'TEXT',
        'verse_zh': 'TEXT',
        'outline_en': 'TEXT',
        'outline_zh': 'TEXT',
        'is_joint': 'INTEGER DEFAULT 0',
    }

    for name, definition in needed.items():
        if name not in cols:
            cur.execute(f'ALTER TABLE sermon ADD COLUMN {name} {definition}')

    cur.execute('''
        UPDATE sermon
        SET title_en = COALESCE(title_en, title),
            title_zh = COALESCE(title_zh, title),
            speaker_en = COALESCE(speaker_en, speaker),
            speaker_zh = COALESCE(speaker_zh, speaker),
            verse_en = COALESCE(verse_en, bible_verse),
            verse_zh = COALESCE(verse_zh, bible_verse),
            outline_zh = COALESCE(outline_zh, outline),
            outline_en = COALESCE(outline_en, '')
        WHERE (title_en IS NULL OR title_en = '')
           OR (title_zh IS NULL OR title_zh = '')
           OR (speaker_en IS NULL OR speaker_en = '')
           OR (speaker_zh IS NULL OR speaker_zh = '')
           OR (verse_en IS NULL OR verse_en = '')
           OR (verse_zh IS NULL OR verse_zh = '')
           OR (outline_zh IS NULL OR outline_zh = '')
    ''')

    cur.execute('ALTER TABLE sermon RENAME TO sermon_old')
    cur.execute('''
        CREATE TABLE sermon (
            sermon_id INTEGER PRIMARY KEY,
            title_en TEXT,
            title_zh TEXT,
            speaker_en TEXT,
            speaker_zh TEXT,
            verse_en TEXT,
            verse_zh TEXT,
            outline_en TEXT,
            outline_zh TEXT,
            is_joint INTEGER DEFAULT 0,
            keyword TEXT,
            lang TEXT,
            updated TEXT DEFAULT CURRENT_TIMESTAMP,
            date TEXT
        )
    ''')

    cur.execute('''
        INSERT INTO sermon (
            sermon_id, title_en, title_zh, speaker_en, speaker_zh, verse_en, verse_zh,
            outline_en, outline_zh, is_joint, keyword, lang, updated, date
        )
        SELECT
            sermon_id,
            COALESCE(title_en, ''),
            COALESCE(title_zh, ''),
            COALESCE(speaker_en, ''),
            COALESCE(speaker_zh, ''),
            COALESCE(verse_en, ''),
            COALESCE(verse_zh, ''),
            COALESCE(outline_en, ''),
            COALESCE(outline_zh, ''),
            COALESCE(is_joint, 0),
            keyword,
            lang,
            updated,
            date
        FROM sermon_old
    ''')

    cur.execute('DROP TABLE sermon_old')
    conn.commit()
    print('Migration complete')
    conn.close()


if __name__ == '__main__':
    migrate_sermon_schema()
