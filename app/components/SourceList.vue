<script setup lang="ts">
import { sourceKind, uniqueSources } from "#shared/evidence";
import type { Source } from "#shared/types/cards";

// Sources of a card, newest first, each with its mark from the evidence timeline.
const props = defineProps<{ sources: Source[] }>();

const t = useTexts();
const sorted = computed(() => uniqueSources(props.sources).sort((a, b) => b.year - a.year));
</script>

<template>
  <ol class="sources">
    <li v-for="source in sorted" :key="source.url">
      <svg class="source-mark" viewBox="0 0 14 14" aria-hidden="true"><EvidenceMark :kind="sourceKind(source)" :x="7" :y="7" :r="5" /></svg>
      <span class="source-year">{{ source.year }}</span>
      <span class="source-text">
        <a :href="source.url" target="_blank" rel="noopener">{{ source.title }}</a>
        <small>{{ t.kindName[sourceKind(source)] }}<template v-if="sourceHost(source.url)">, {{ sourceHost(source.url) }}</template></small>
      </span>
    </li>
  </ol>
</template>
