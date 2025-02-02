# easyslides - web
### This is a python flask based web application aims to help church in worship preparation and presentation.

## Current Features List
* Home - Home page shows all 52 Sundays with Sermon information as well as the worship team members who have been assigned. From there, you can select "Song" to arrange your worship song, or "Team" to arrange your worship team
* Worship Song Arrangement - You can search the songs from current database, or database that's been imported
  * You can change the order of the songs you picked, as well as the parts of the lyrics (verse, chours, bridge, etc...)
  * You can add notes to your arrangement (Notes supports Bible search using API.Bible API on both ASV and Biblica® Open Chinese Contemporary Bible Traditional 2023 versions)
* Worship Team Arrangement - You can add available member to your roster for selected Sunday.
* Schedule - A drop-down selection of all 52 Sundays that allows your worship team member to pick their availability as well as the roles they could participate
* Export - Export arranged worship slides into easyslides format (zip file) which can be imported as schedule. (Easyslides version 5.2 RC4)
* Save - Each arranged worship slides will be saved to dB as well as a json format file for presentation purpose.
* Worship Presentation
  * Present in Easyslides (exported zip format)
  * Present from the web based on json file with below point of views (All views will be synced with current slide)
    * Worship leader - control arrows to move slides
    * Controller (Admin) - Able to add announcement or slides on the fly (Future enhancement)
    * Congregation - Normal slide show, the best view (Future enhancement in controlling font size dynamically)
    * Musician - See lyrics along with the chords (if available) 


### Current imported song database
* en.sqlite (Large amount of English hymns, not latest update)
* zh.sqlite (Mostly from 迦南詩選)
* stream_of_praise.db (讚美之泉, lyrics only in Chinese/Taiwanese)
* Coming soon - 台語聖詩 
