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
  themeConfig: {
    docsRoot: root,
    docsVersion: version.split('.').slice(0, 2).join('.'),
    outline: [2, 3],
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/iqb-berlin/testcenter' }
    ],
    sidebar: [
      {
        text: 'Administration',
        items: [
          { text: 'Installation and Update', link: '/pages/installation-prod' },
          { text: 'Booklet-Konfiguration', link: '/pages/booklet-config' },
          { text: 'Modus der Testdurchführung', link: '/pages/test-mode' },
          { text: 'Textersetzungen', link: '/pages/custom-texts' },
          { text: 'Gruppenmonitor Statusmeldungen', link: '/pages/test-session-super-states' },
          { text: 'Log-Events', link: '/pages/logging' }
        ]
      },
      {
        text: 'Development',
        items: [
          { text: 'Installation', link: '/pages/installation-dev' },
          { text: "Developer's Guide", link: '/pages/developer-guide' },
          // not a VitePress page: _self makes the browser load it instead of the client-side router
          { text: 'HTTP API', link: '/api/index.html', target: '_self' }
        ]
      }
    ]
  }
});
