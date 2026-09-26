<script setup>
import { useVersions } from './versions.mjs';

const { current, latest, url } = useVersions();
</script>

<template>
  <div v-if="latest && latest !== current" class="outdated-notice">
    Dies ist die Dokumentation für Version {{ current }}.
    <a :href="url(latest)">Zur aktuellen Version {{ latest }}</a>
  </div>
</template>

<style scoped>
.outdated-notice {
  margin-bottom: 24px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--vp-custom-block-warning-bg);
  color: var(--vp-custom-block-warning-text);
}

.outdated-notice a {
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
}
</style>
