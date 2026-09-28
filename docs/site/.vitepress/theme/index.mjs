import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import OutdatedNotice from './OutdatedNotice.vue';
import VersionSelect from './VersionSelect.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-content-before': () => h(VersionSelect),
    'doc-before': () => h(OutdatedNotice),
    'home-hero-info-before': () => h(OutdatedNotice)
  })
};
