<script setup>
import { computed } from 'vue';
import { useVersions } from './versions.mjs';

const { current, versions, url } = useVersions();

// a version missing from the list (phased out or not added yet) still shows itself
const options = computed(() => (versions.value.includes(current) ? versions.value : [current, ...versions.value]));

const open = event => { window.location.href = url(event.target.value); };
</script>

<template>
  <select class="version-select" :value="current" aria-label="Version" @change="open">
    <option v-for="version in options" :key="version" :value="version">Version {{ version }}</option>
  </select>
</template>

<style scoped>
.version-select {
  appearance: auto; /* VitePress removes the arrow from all selects */
  height: 34px;
  margin: 0 16px;
  padding: 0 8px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
</style>
