# Templates

This directory contains the Jinja HTML templates used by the Flask app. The templates are grouped by feature area to match the main sections of the site.

For the matching routes and logic, see [web/index.py](../web/index.py).

## Directory Map

### Root templates
These templates sit directly in the `web/templates/` folder and are used for core app pages.

| File | Route | Purpose |
| --- | --- | --- |
| `base.html` | --- | Shared page layout for most views. Includes base styles, scripts, and header logic. |
| `home.html` | `/` | Home landing page for the app. |
| `profile.html` | `/profile` | Team/profile overview page. |
| `files.html` | `/files` | Lists exported JSON and EasySlides ZIP files. |
| `json.html` | --- | Used when a worship page loads a JSON export via `?json=...` | displays raw JSON content. |
| `builder_template.html` | --- | Starter template that uses `base.html` for creating new pages. |
| `README.md` | --- | Documentation for the template structure itself. |

### Admin templates
Used for admin and reporting pages.

| File | Route | Purpose |
| --- | --- | --- |
| `admin/home.html` | `/admin` | Admin dashboard. |
| `admin/info.html` | `/admin/info` | Weekly announcements and service info. |
| `admin/people.html` | `/admin/people` | Team member management and role assignment. |
| `admin/calendar.html` | `/admin/calendar` | Church calendar and scheduling overview. |
| `admin/report_pdf.html` | `/admin/report/<id>` | Weekly report display. |

### Worship templates
Used for weekly worship planning and service setup.

| File | Route | Purpose |
| --- | --- | --- |
| `worship/worship.html` | `/worship` and `/worship/edit` | Main worship dashboard and list of Sundays, with override URL. |
| `worship/notes.html` | `/worship/<id>` and `/worship/<id>/<tab>` | Weekly notes and content overview, with specific linking to a feature tab. |
| `worship/songs.html` | `/worship/<id>/edit` | Edit weekly song arrangements and ordering. |
| `worship/chords.html` | `/worship/<id>/chords` and `/worship/chords/<ids>` | Display song chords for the week or specific songs respectively. |
| `worship/sheets.html` | `/worship/<id>/sheets` and `/worship/sheets/<ids>` | Display song sheets for the week or specific songs respectively. |
| `worship/schedule.html` | `/worship/schedule` | Team availability and service staffing. |

### Slides templates
Used for presentation and live display modes.

| File | Route | Purpose |
| --- | --- | --- |
| `slides/slides.html` | `/slides` | Slides dashboard. |
| `slides/slides_admin.html` | `/slides/admin` | Admin presentation control. |
| `slides/slides_lead.html` | `/slides/lead` | Leader presentation control. |
| `slides/slides_view.html` | `/slides/view` | Viewer/display mode.
| `slides/slides_musician.html` | `/slides/musician` | Musician focused view (if used). |

### Song templates
Used for the song library and editing workflow.

| File | Route | Purpose |
| --- | --- | --- |
| `song/song_list.html` | `/song/list` | Browse all songs. |
| `song/song_editor.html` | `/song/<id>/edit` | Create or edit a song entry. |

### Partial templates
Shared HTML fragments used across multiple pages.

| File | Purpose |
| --- | --- |
| `partials/_admin_header.html` | Header for admin pages. |
| `partials/_home_header.html` | Header for home page. |
| `partials/_worship_header.html` | Header for worship pages. |

## Template Notes

- `base.html` is the main shared layout and should be used as the starting point for most pages.
- Folders are organized by section rather than by page type.
- Route names and file names generally align closely, so this structure reflects the app’s URL layout.

## Related Files

- [web/index.py](../web/index.py) — Defines the routes that render these templates
- [web/templates](.) — Template root directory