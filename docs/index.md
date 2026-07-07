---
layout: default
---
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

There are two important files for the Testcenter. A file named **Testtaker** defines access rights for testtakers and the behavior of the test-control system. A second file named **Booklet** governs the behavior and structure of the booklet. The fields and attributes of these files are described below. This is a condensed, automatically generated documentation. Detailed information can be found [here](https://iqb-berlin.github.io/tba-info/study-run/preparation/test-files/). The additional documentation covers the groupmonitor status and the test modes. **This documentation is in German.**

**Booklet:**

* [Parameters of required booklet elements](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/booklet.html)
* [Parameters of optional booklet-configuration](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/booklet-config.html)
* [Parameters of optional adaptive-configuration](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/adaptive-config.html)

**Testtaker:**

* [Parameters of required testtaker elements](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/testtaker.html)
* [Parameters of optional testtaker custom-text](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/custom-texts.html)

**Additional information:**

* [Overview about super-states of running sessions and their icons](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/test-session-super-states.html)
* [List of modes of test-execution](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/test-mode.html)

### Install & Run

* [Installation and Update](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-prod.html)

### For Developers

* [Installation for Development](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-dev.html)
* [Developer's Guide](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/developer-guide.html)

### API Documentation

* [HTTP API Backend](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/api/index.html)
* [Verona Player API](https://verona-interfaces.github.io/player/)
