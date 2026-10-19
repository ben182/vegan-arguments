<script setup lang="ts">
import type { QueueCounts, QueueKind } from "~/composables/usePracticeSession";

// "neu / in Arbeit / zum Wiederholen" counters, rendered inside a <dl>.
defineProps<{ counts: QueueCounts; current?: QueueKind }>();

const t = useTexts();
</script>

<template>
  <div class="count-new" :class="{ current: current === 'new' }"><dt>{{ t.countNew }}</dt><dd>{{ counts.new }}</dd></div>
  <div class="count-learning" :class="{ current: current === 'learning' }"><dt>{{ t.countLearning }}</dt><dd>{{ counts.learning }}</dd></div>
  <div class="count-review" :class="{ current: current === 'review' }"><dt>{{ t.countReview }}</dt><dd>{{ counts.review }}</dd></div>
</template>
