import { defineConfig } from 'vitepress';

// A release is deployed twice: unprefixed as the latest version and below its minor version.
const prefix = process.env.DOCS_PREFIX;

export default defineConfig({
  base: prefix ? `/testcenter/${prefix}/` : '/testcenter/',
  title: 'Testcenter Dokumentation',
  description: 'IQB-Testcenter',
  srcExclude: ['generated/**'],
  themeConfig: {
    outline: [2, 3],
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/iqb-berlin/testcenter' }
    ],
    sidebar: [
      {
        text: 'Installation',
        items: [
          { text: 'Production', link: '/pages/installation-prod' },
          { text: 'Development', link: '/pages/installation-dev' }
        ]
      },
      {
        text: 'Konfiguration',
        items: [
          { text: 'Booklet-Konfiguration', link: '/pages/booklet-config' },
          { text: 'Modus der Testdurchführung', link: '/pages/test-mode' },
          { text: 'Textersetzungen', link: '/pages/custom-texts' },
          { text: 'Log-Events', link: '/pages/logging' },
          { text: 'Gruppenmonitor Statusmeldungen', link: '/pages/test-session-super-states' }
        ]
      },
      {
        text: 'Entwicklung',
        items: [
          { text: "Developer's Guide", link: '/pages/developer-guide' }
        ]
      }
    ]
  }
});
