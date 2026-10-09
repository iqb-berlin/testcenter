import fs from 'fs';
import { defineConfig } from 'vitepress';

const root = '/testcenter/';
// A release is deployed twice: unprefixed as the latest version and below its minor version.
const prefix = process.env.DOCS_PREFIX;
const { version } = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));

export default defineConfig({
  base: prefix ? `${root}${prefix}/` : root,
  title: 'Testcenter Documentation',
  description: 'IQB-Testcenter',
  srcExclude: ['generated/**'],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        outline: [2, 3],
        sidebar: [
          {
            text: 'Administration',
            items: [
              {
                text: 'Setup',
                collapsed: true,
                items: [
                  { text: 'Installation', link: '/pages/installation-prod' },
                  { text: 'Configuration', link: '/pages/test-mode' }
                ]
              },
              {
                text: 'Test Files',
                link: '/pages/spec-testfiles',
                collapsed: true,
                items: [
                  { text: 'Booklet Configuration', link: '/pages/booklet-config' },
                  { text: 'Test Mode', link: '/pages/test-mode' },
                  { text: 'Custom Texts', link: '/pages/custom-texts' }
                ]
              },
              {
                text: 'Tests',
                collapsed: true,
                items: [
                  { text: 'Load Test', link: '/pages/load-test' },
                  { text: 'E2E Test', link: '/pages/e2e' }
                ]
              },
              {
                text: 'Group Monitor',
                collapsed: true,
                items: [
                  { text: 'Super States', link: '/pages/test-session-super-states' }
                ]
              },
              { text: 'Log Events', link: '/pages/logging' }
            ]
          },
          {
            text: 'Development',
            items: [
              { text: 'Installation', link: '/pages/installation-dev' },
              { text: "Developer's Guide", link: '/pages/developer-guide' },
              { text: 'Contributing Guide', link: '/pages/contributing' },
              { text: 'Style Guide', link: '/pages/style-guide' }
            ]
          },
          {
            text: 'Specifications',
            link: '/pages/spec-index',
            items: [
              { text: 'Testfiles', link: '/pages/spec-testfiles' },
              { text: 'API of Verona Player', link: 'https://verona-interfaces.github.io/player/' },
              { text: 'HTTP API of the backend', link: '/api/index.html', target: '_self' }
            ]
          }
        ]
      }
    },
    de: {
      label: 'Deutsch',
      lang: 'de',
      link: '/de/',
      themeConfig: {
        outline: [2, 3],
        sidebar: [
          {
            text: 'Administration',
            items: [
              {
                text: 'Einrichtung',
                collapsed: true,
                items: [
                  { text: 'Installation', link: '/de/pages/installation-prod' },
                  { text: 'Konfiguration', link: '/de/pages/test-mode' }
                ]
              },
              {
                text: 'Testdateien',
                collapsed: true,
                items: [
                  { text: 'Booklet-Konfiguration', link: '/de/pages/booklet-config' },
                  { text: 'Modus der Testdurchführung', link: '/de/pages/test-mode' },
                  { text: 'Textersetzungen', link: '/de/pages/custom-texts' }
                ]
              },
              {
                text: 'Tests',
                collapsed: true,
                items: [
                  { text: 'Load-Test', link: '/de/pages/load-test' },
                  { text: 'E2E-Test', link: '/de/pages/e2e' }
                ]
              },
              {
                text: 'Gruppenmonitor',
                collapsed: true,
                items: [
                  { text: 'Statusmeldungen', link: '/de/pages/test-session-super-states' }
                ]
              },
              { text: 'Log-Events', link: '/de/pages/logging' }
            ]
          },
          {
            text: 'Entwicklung',
            items: [
              { text: 'Installation', link: '/de/pages/installation-dev' },
              { text: 'Entwicklerhandbuch', link: '/de/pages/developer-guide' },
              { text: 'Mitwirkungsleitfaden', link: '/de/pages/contributing' },
              { text: 'Stil-Leitfaden', link: '/de/pages/style-guide' }
            ]
          },
          {
            text: 'Spezifikationen',
            link: '/de/pages/spec-index',
            items: [
              { text: 'Testdateien', link: '/de/pages/spec-testfiles' },
              { text: 'API Verona Player', link: 'https://verona-interfaces.github.io/player/' },
              { text: 'HTTP API des Backends', link: '/api/index.html', target: '_self' }
            ]
          }
        ]
      }
    }
  },

  themeConfig: {
    docsRoot: root,
    docsVersion: version.split('.').slice(0, 2).join('.'),
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/iqb-berlin/testcenter' }
    ]
  }
});
