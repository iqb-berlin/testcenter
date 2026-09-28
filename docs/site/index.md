---
layout: home
hero:
  name: IQB-Testcenter
  text: Documentation
  tagline: For administrators and developers
  actions:
    - theme: brand
      text: Installation
      link: /pages/installation-prod
    - theme: alt
      text: Development
      link: /pages/installation-dev
---

The IQB-Testcenter is a web application for technology based assessments and surveys. It is developed by
[the Institute for Educational Quality Improvement (IQB)](https://www.iqb.hu-berlin.de/) in Berlin, Germany.
How to prepare and run a study is described in the
[TBA-Wiki](https://iqb-berlin.github.io/tba-info/study-run/).

## Administration

- [Installation and update](./pages/installation-prod.md)
- Configuration: [booklet](./pages/booklet-config.md), [test modes](./pages/test-mode.md),
  [custom texts](./pages/custom-texts.md)
- [Group monitor states](./pages/test-session-super-states.md)
- [Log events](./pages/logging.md)

## Development

- [Installation for development](./pages/installation-dev.md)
- [Developer's Guide](./pages/developer-guide.md)
- [Contributing Guide](https://github.com/iqb-berlin/testcenter/blob/master/docs/CONTRIBUTING.md)
- [Style Guide](https://github.com/iqb-berlin/testcenter/blob/master/docs/style-guide.md)

## Specifications and APIs

A test consists of units, which are integrated via a **Unit XML**, and is configured with a
**Booklet XML** and a **Testtaker XML**. Their formats are specified in the
[IQB specifications](https://iqb-specifications.github.io/):

- [Booklet XML](https://iqb-specifications.github.io/testcenter-booklet-xml/)
- [Testtaker XML](https://iqb-specifications.github.io/testcenter-testtaker-xml/)
- [Unit XML](https://github.com/iqb-specifications/unit-xml)

The interfaces of the Testcenter:

- [HTTP API of the backend](./api/index.html){target="_self"}
- [Verona Player API](https://verona-interfaces.github.io/player/)
