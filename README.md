<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <!-- <a href="https://github.com/EFCNC/worship">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a> -->

<h3 align="center">Project... WASP?</h3>

  <p align="center">
    Worship Application for Songs and Presentation...?
    A python flask based web application aims to help churches in worship preparation and presentation.
    <br />
    <a href="https://github.com/EFCNC/worship"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/EFCNC/worship/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/EFCNC/worship/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

<!-- [![Product Name Screen Shot][product-screenshot]](https://example.com) -->
WIP

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With
* [![JQuery][JQuery.com]][JQuery-url]
* [![Jinja][Jinja.com]][Jinja-url]


<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

- Have Python installed

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/EFCNC/worship.git
   ```
2. Install Python packages
   ```sh
   pip install -r requirements.txt
   ```
3. *(Optional)* Add ESV API
    1. Get a free ESV API Key at [https://api.esv.org/](https://api.esv.org/)
    2. Enter your API in `web/static/config.js`
   ```js
   const ESV_API_KEY = "YOUR_ESV_API_KEY_HERE";
   ```
5. Start the web server:
   ```js
   python web/index.py
   ```
   Website is viewable at [http://localhost:5000/](http://localhost:5000/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

### Home Page
The Home page provides navigation to four main sections:
- **Worship** - Manage worship arrangements and team scheduling
- **Admin** - Administrative tools and configuration
- **Slides** - Present and manage your arranged worship services
- **Song List** - View and edit existing songs in the database

### Worship Section

**Worship Home Page** - Manage all 52 Sundays with sermon information and team assignments:
- **Info** - Update this week's news
- **Edit** - Adjust sermon title, speaker, Bible references, and language
- **Songs** - Arrange this week's song order and customize the sequence (verse, chorus, bridge, etc.)
- **Notes** - Quick access to chords, YouTube videos, and music sheets for this week's songs
- **Team** - Add members to your roster and assign their roles

**Song List** - View and edit existing songs in the database

**Schedule** - Worship team members can indicate their availability and choose which weeks to lead.

### Admin Section

- **Info** - Update weekly news and announcements
- **People** - Manage worship team member profiles and roles
- **Calendar** - View and manage the 52-Sunday calendar with events
- **Reports** - Generate and view weekly bulletins

### Slides Section

Present through multiple synchronized views:
- **Admin** - Add announcements or slides on the fly
- **Lead** - Control the slides
- **View** - Presentation view of the slides
- **Musician** - WIP
- **Sheets** - Music sheets for the current week's songs
- **Chords** - View lyrics with chord notations

Export and save your arrangements as JSON or easyslides format (zip) compatible with Easyslides v5.2 RC4.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- ROADMAP -->
## Roadmap

- [x] Working build
- [x] Use revealjs for presentations
- [ ] Migrate songs to a new database format

See the [open issues](https://github.com/EFCNC/worship/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/EFCNC/worship/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=EFCNC/worship" alt="contrib.rocks image" />
</a>


<!-- LICENSE -->
## License

Distributed under the project_license. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* []()
* []()
* []()

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Supported Song Databases
- **en.sqlite** - Large collection of English hymns
- **zh.sqlite** - Primarily from 迦南詩選
- **stream_of_praise.db** - 讚美之泉 (lyrics in Chinese/Taiwanese)
- **Coming soon** - 台語聖詩

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/EFCNC/worship.svg?style=for-the-badge
[contributors-url]: https://github.com/EFCNC/worship/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/EFCNC/worship.svg?style=for-the-badge
[forks-url]: https://github.com/EFCNC/worship/network/members
[stars-shield]: https://img.shields.io/github/stars/EFCNC/worship.svg?style=for-the-badge
[stars-url]: https://github.com/EFCNC/worship/stargazers
[issues-shield]: https://img.shields.io/github/issues/EFCNC/worship.svg?style=for-the-badge
[issues-url]: https://github.com/EFCNC/worship/issues
[license-shield]: https://img.shields.io/github/license/EFCNC/worship.svg?style=for-the-badge
[license-url]: https://github.com/EFCNC/worship/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
<!-- Shields.io badges. You can a comprehensive list with many more badges at: https://github.com/inttter/md-badges -->

[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com

[Jinja.com]: https://img.shields.io/badge/jinja-white.svg?style=for-the-badge&logo=jinja&logoColor=black
[Jinja-url]: https://jinja.palletsprojects.com/en/stable/