import { computed, onMounted, ref } from 'vue';
import { useData } from 'vitepress';

// Every version reads the list of the unprefixed (latest) deployment, so it also knows newer versions.
const versions = ref([]);
let request;

export const useVersions = () => {
  const { page, theme } = useData();
  const current = theme.value.docsVersion;
  const root = theme.value.docsRoot;

  onMounted(() => {
    request ??= fetch(`${root}versions.json`)
      .then(response => response.json())
      .then(list => { versions.value = list; })
      .catch(() => {}); // not reachable: only the current version is shown
  });

  const latest = computed(() => versions.value[0]);
  const pagePath = computed(() => page.value.relativePath
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '.html'));
  // the latest version is linked unprefixed, so its URLs stay the same across releases
  const url = version => `${root}${version === latest.value ? '' : `${version}/`}${pagePath.value}`;

  return { current, versions, latest, url };
};
