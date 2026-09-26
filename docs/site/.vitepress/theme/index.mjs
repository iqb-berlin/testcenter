import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import OutdatedNotice from './OutdatedNotice.vue';
import VersionSelect from './VersionSelect.vue';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-content-before': () => h(VersionSelect),
    'doc-before': () => h(OutdatedNotice)
  })
};
