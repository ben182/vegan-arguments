<script setup lang="ts">
import { SOURCE_KINDS } from "#shared/evidence";

// Key to the marks of the evidence timeline.
const t = useTexts();
</script>

<template>
  <ul class="legend" :aria-label="t.legendLabel">
    <li v-for="kind in SOURCE_KINDS" :key="kind">
      <svg viewBox="0 0 14 14" aria-hidden="true"><EvidenceMark :kind="kind" :x="7" :y="7" :r="5" /></svg>{{ t.kindName[kind] }}
    </li>
  </ul>
</template>
