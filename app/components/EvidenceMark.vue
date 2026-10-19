<script setup lang="ts">
import type { SourceKind } from "#shared/types/cards";

// One mark of the evidence timeline, as SVG content: diamond = review, dot = single study,
// ring = official source, square = other.
const props = defineProps<{ kind: SourceKind; x: number; y: number; r: number }>();

const round = (n: number) => Math.round(n * 10) / 10;
const half = computed(() => round(props.kind === "review" ? props.r * 0.85 : props.r - 0.8));
</script>

<template>
  <rect v-if="kind === 'review'" class="mark mark-review" :x="round(x - half)" :y="round(y - half)" :width="half * 2" :height="half * 2" :transform="`rotate(45 ${x} ${y})`" />
  <circle v-else-if="kind === 'study'" class="mark mark-study" :cx="x" :cy="y" :r="r" />
  <circle v-else-if="kind === 'official'" class="mark mark-official" :cx="x" :cy="y" :r="half" />
  <rect v-else class="mark mark-other" :x="round(x - half)" :y="round(y - half)" :width="half * 2" :height="half * 2" />
</template>
