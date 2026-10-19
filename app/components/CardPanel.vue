<script setup lang="ts">
import { isCardRoute } from "~/plugins/card-panel";

// Wide sheet with the full card, over the page it was opened from (see plugins/card-panel.ts).
const t = useTexts();
const deck = useDeck();
const router = useRouter();
// Not useRoute(): outside of pages it only updates once a new page has rendered
const route = router.currentRoute;
const { background, manualCardId } = useNuxtApp().$cardPanel;
const cardStatus = useCardStatus();

const dialog = ref<HTMLDialogElement>();
const copied = ref(false);

const card = computed(() => {
  const id = manualCardId.value ?? (background.value && isCardRoute(route.value) ? String(route.value.params.id) : null);
  return id ? deck.value.byId[id] : undefined;
});

watch(card, (current, previous) => {
  const el = dialog.value;
  if (!el) return;
  if (!current) {
    if (el.open) el.close();
    return;
  }
  if (current !== previous) copied.value = false;
  if (!el.open) el.showModal();
  el.scrollTop = 0;
}, { flush: "post" });

/** Close: back to the page the card was opened from (otherwise to the start page). */
function close() {
  if (manualCardId.value) {
    manualCardId.value = null;
    return;
  }
  if (window.history.state?.back) router.back();
  else router.replace(t.value.homePath);
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialog.value) close();
}

async function share() {
  const c = card.value;
  if (!c) return;
  const url = `${window.location.origin}${t.value.cardPath(c.id)}`;
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ title: c.argument, text: c.answer, url });
    else {
      await navigator.clipboard.writeText(url);
      copied.value = true;
    }
  } catch {
    // cancelled
  }
}
</script>

<template>
  <dialog ref="dialog" class="card-panel" aria-labelledby="card-argument" @click="onBackdropClick" @cancel.prevent="close">
    <!-- Zero-height sticky bar: the close button stays in view without taking room from the card -->
    <div class="card-panel-bar">
      <button class="close-button" :aria-label="t.close" @click="close">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
      </button>
    </div>
    <div class="card-panel-inner">
      <CardBody v-if="card" :card="card" :status="cardStatus(card.id)">
        <template #footer>
          <button class="button" @click="share">{{ copied ? t.linkCopied : t.copyLink }}</button>
        </template>
      </CardBody>
    </div>
  </dialog>
</template>
