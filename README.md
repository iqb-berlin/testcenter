[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI Status](https://scm.cms.hu-berlin.de/iqb/testcenter/badges/master/pipeline.svg)](https://scm.cms.hu-berlin.de/iqb/testcenter)
![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/iqb-berlin/testcenter)

![LTS](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fiqb-berlin%2Ftestcenter%2Fmaster%2Fpackage.json&query=%24.iqb%5B%22release-channels%22%5D.lts&style=flat&label=LTS&link=https%3A%2F%2Fgithub.com%2Fiqb-berlin%2Ftestcenter%2Freleases)
![Stable](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fiqb-berlin%2Ftestcenter%2Fmaster%2Fpackage.json&query=%24.iqb%5B%22release-channels%22%5D.stable&style=flat&label=Stable&link=https%3A%2F%2Fgithub.com%2Fiqb-berlin%2Ftestcenter%2Freleases)

# IQB-Testcenter

The IQB-Testcenter is a web application for technology based accessed and surveys. It is developed by
[the Institute for Educational Quality Improvement (IQB)](https://www.iqb.hu-berlin.de/) in Berlin, Germany.

### General

* [Bug Reports](https://github.com/iqb-berlin/testcenter/issues)
* [Changelog](https://github.com/iqb-berlin/testcenter/releases/latest)
* **[Detailed Documentation to start the test run](https://iqb-berlin.github.io/tba-info/study-run/)**

### Advanced Documentation

There are two important files for the Testcenter. A file named **Testtaker** defines access rights for testtakers and the behavior of the test-control system. A second file named **Booklet** governs the behavior and structure of the booklet. The fields and attributes of these files are described in: [IQB-Specifications](https://iqb-specifications.github.io/). There are two repositories. One for testtaker-XML and one for the booklet-XML. You can find the generated documentation here:

* [Booklet](https://iqb-specifications.github.io/testcenter-booklet-xml/)
* [Testtaker](https://iqb-specifications.github.io/testcenter-testtaker-xml/)

**Detailed information can be found in the [TBA-Wiki](https://iqb-berlin.github.io/tba-info/study-run/preparation/test-files/).**

### Install & Run

* [Installation and Update](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-prod.html)

### For Developers

* [Installation for Development](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-dev.html)
* [Developer's Guide](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/developer-guide.html)

### API Documentation

* [HTTP API Backend](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/api/index.html)
* [Verona Player API](https://verona-interfaces.github.io/player/)
