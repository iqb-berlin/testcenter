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
          { text: 'Configuration', link: '/pages/config-prod' },
        ]
      },
      {
        text: 'Development',
        items: [
          { text: 'Installation', link: '/pages/installation-dev' },
          { text: "Guidelines", link: '/pages/developer-guide' },
          { text: 'Contribution Guide', link: '/pages/contributing' },
          { text: 'Conventions', link: '/pages/style-guide' }
        ]
      },
      {
        text: 'Specifications', link: '/pages/spec-index',
        items: [
          { text: 'Testfiles', link: '/pages/spec-testfiles' },
          { text: 'API of Verona Player', link: 'https://verona-interfaces.github.io/player/' },
          // not a VitePress page: _self makes the browser load it instead of the client-side router
          { text: 'HTTP API of the backend', link: '/api/index.html', target: '_self' }
        ]
      },
      {
        text: 'Study/Survey Management',
        items: [
          { text: 'Booklet-Configuration', link: '/pages/booklet-config' },
          { text: 'Test-Mode', link: '/pages/test-mode' },
          { text: 'Custom-Text', link: '/pages/custom-texts' },
          { text: 'Log-Events', link: '/pages/logging' }
        ]
      },
    ]
  }
});
