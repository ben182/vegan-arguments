<script setup lang="ts">
import type { CategoryId } from "#shared/types/cards";

// Category filter buttons with card counts. "" stands for "all categories".
const props = defineProps<{
  label: string;
  isPressed: (category: CategoryId | "") => boolean;
  /** Prepend an "all" button (look-up page). */
  withAll?: boolean;
}>();
const emit = defineEmits<{ select: [category: CategoryId | ""] }>();

const t = useTexts();
const deck = useDeck();

const countFor = (category: CategoryId | "") => deck.value.cards.filter((c) => !category || c.category === category).length;
const entries = computed<(CategoryId | "")[]>(() => {
  const categories = deck.value.categoryIds.filter((c) => countFor(c) > 0);
  return props.withAll ? ["", ...categories] : categories;
});
</script>

<template>
  <div class="tabs" role="group" :aria-label="label">
    <button
      v-for="category in entries"
      :key="category"
      class="tab"
      :data-category="category"
      :aria-pressed="isPressed(category)"
      :style="category ? { '--hue': categoryHue(category) } : undefined"
      @click="emit('select', category)"
    >
      <span v-if="category" class="dot" aria-hidden="true" />{{ category ? deck.categoryName(category) : t.all }}<span class="count">{{ countFor(category) }}</span>
    </button>
  </div>
</template>
