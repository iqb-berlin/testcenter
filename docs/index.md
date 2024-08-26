---
layout: default
---
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![(CI Status)](https://scm.cms.hu-berlin.de/iqb/testcenter/badges/master/pipeline.svg)](https://scm.cms.hu-berlin.de/iqb/testcenter)

Releases:

![Latest](https://img.shields.io/github/v/tag/iqb-berlin/testcenter)
![Stable](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fiqb-berlin%2Ftestcenter%2Fmaster%2Fpackage.json&query=%24.iqb.release-channels.stable&style=flat&label=Stable)
![LTS](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fiqb-berlin%2Ftestcenter%2Fmaster%2Fpackage.json&query=%24.iqb.release-channels.lts&style=flat&label=LTS)

{% include {{ versions }} %}

# IQB-Testcenter

## [Deutsch]

Das IQB-Testcenter ist eine Webanwendung für die Durchführung von Kompetenztests oder Befragungen.
Für Beschreibungen und Hinweise zur Benutzung konsultieren Sie bitte unser
[Benutzerhandbuch](https://iqb-berlin.github.io/tba-info/Testcenter/).
Der Rest dieser ReadMe beschreibt die technischen Details zur Verwendung und ist vornehmlich an Administratoren und
Entwickler gerichtet.

Eine Versionshistorie und Änderungshinweise finden sie unter [Releases](https://github.com/iqb-berlin/testcenter/releases).

## [English]

The IQB-Testcenter is a web application for technology based accessed and surveys. It is developed by
[the Institute for Educational Quality Improvement (IQB)](https://www.iqb.hu-berlin.de/) in Berlin, Germany.

### General
* **[User Manual](https://iqb-berlin.github.io/tba-info/Testcenter/)** (in german)
* [Bug Reports](https://github.com/iqb-berlin/testcenter/issues)
* [Changelog](https://pages.cms.hu-berlin.de/iqb/testcenter/CHANGELOG.html)

#### Additional docs and settings
* [Overview about super-states of running sessions and their icons](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/test-session-super-states.html)
* [List of modes of test-execution](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/test-mode.html)
* [Parameters of booklet-configuration](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/booklet-config.html)
* [Customizable Labels in the UI](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/custom-texts.html)

### Install & Run
* **[Installation and Update](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-prod.html)**

### For Developers
* **[Installation for Development](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-dev.html)**
* **[Developer's Guide](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/developer-guide.html)**

### API Documentation
* [HTTP API Backend](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/api/index.html)
* [Verona Player API](https://verona-interfaces.github.io/player/)

### Compodoc Documentation
* [Frontend](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/compodoc-frontend/index.html)
* [Broadcasting-Service](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/compodoc-broadcasting-service/index.html)

### Test Coverage
* [Backend by Unit-Tests](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/test-coverage-backend-unit/index.html)
* [Frontend by Unit-Tests](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/test-coverage-frontend-unit/report/index.html)
* [Broadcasting-Service by Unit-Tests](https://pages.cms.hu-berlin.de/iqb/testcenter/dist/test-coverage-broadcasting-service-unit/lcov-report/index.html)

### Misc
* [Install and run without docker](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-local.html)
