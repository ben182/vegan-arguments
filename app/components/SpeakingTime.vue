<script setup lang="ts">
import { speakingSeconds } from "#shared/evidence";

// Estimated time to say the answer out loud, with a small bar (5 seconds per step).
const props = defineProps<{ text: string }>();

const t = useTexts();
const seconds = computed(() => speakingSeconds(props.text));
</script>

<template>
  <p class="speaking-time">
    <span class="speaking-bar" aria-hidden="true"><span v-for="i in Math.min(8, seconds / 5)" :key="i" /></span>{{ t.speakingTime(seconds) }}
  </p>
</template>
