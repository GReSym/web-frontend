<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import InfiniteSentinel from '@/components/common/InfiniteSentinel.vue'
import { screenshotFull, screenshotThumb } from '@/utils/steam'

// Horizontal gallery. Screenshots come from the Steam CDN, so only a few small thumbnails (600×338) are put on the
// page at first and more are added when the user scrolls to the end; the full-size image is requested only in the
// expanded view, one at a time.

const props = withDefaults(defineProps<{ urls: string[]; title: string; batch?: number }>(), {
  batch: 4,
})

const shown = ref(props.batch)
const scroller = ref<HTMLElement | null>(null)
const current = ref<number | null>(null)

watch(
  () => props.urls,
  () => {
    shown.value = props.batch
    current.value = null
  },
)

const visible = computed(() => props.urls.slice(0, shown.value))
const hasMore = computed(() => shown.value < props.urls.length)

function showMore() {
  shown.value = Math.min(shown.value + props.batch, props.urls.length)
}

function scrollBy(direction: 1 | -1) {
  const el = scroller.value
  if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
}

function open(i: number) {
  current.value = i
}
function close() {
  current.value = null
}
function step(delta: number) {
  if (current.value === null) return
  const n = props.urls.length
  const next = (current.value + delta + n) % n
  // Opening a screenshot past the loaded thumbnails loads them as well
  if (next >= shown.value) shown.value = Math.min(next + 1, props.urls.length)
  current.value = next
}

function onKeydown(e: KeyboardEvent) {
  if (current.value === null) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') step(1)
  else if (e.key === 'ArrowLeft') step(-1)
}

watch(current, (value) => {
  if (value !== null) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = value !== null ? 'hidden' : ''
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="gallery">
    <button
      type="button"
      class="nav prev"
      :aria-label="$t('game.scrollLeft')"
      @click="scrollBy(-1)"
    >
      ‹
    </button>
    <div ref="scroller" class="strip">
      <button
        v-for="(url, i) in visible"
        :key="url"
        type="button"
        class="shot"
        :aria-label="$t('game.openScreenshot', { n: i + 1 })"
        @click="open(i)"
      >
        <img
          :src="screenshotThumb(url)"
          :alt="$t('game.screenshotAlt', { title, n: i + 1 })"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </button>
      <InfiniteSentinel
        horizontal
        :root="scroller"
        root-margin="0px 200px 0px 0px"
        :active="hasMore"
        :loading="false"
        @load="showMore"
      />
    </div>
    <button
      type="button"
      class="nav next"
      :aria-label="$t('game.scrollRight')"
      @click="scrollBy(1)"
    >
      ›
    </button>
  </div>

  <Teleport to="body">
    <div
      v-if="current !== null"
      class="lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="close"
    >
      <button type="button" class="lb-btn lb-close" :aria-label="$t('common.close')" @click="close">
        ✕
      </button>
      <button
        v-if="urls.length > 1"
        type="button"
        class="lb-btn lb-prev"
        :aria-label="$t('common.previous')"
        @click="step(-1)"
      >
        ‹
      </button>
      <img
        :key="urls[current]"
        :src="screenshotFull(urls[current]!)"
        :alt="$t('game.screenshotAlt', { title, n: current + 1 })"
        referrerpolicy="no-referrer"
        decoding="async"
      />
      <button
        v-if="urls.length > 1"
        type="button"
        class="lb-btn lb-next"
        :aria-label="$t('common.next')"
        @click="step(1)"
      >
        ›
      </button>
      <p class="lb-count">{{ current + 1 }} / {{ urls.length }}</p>
    </div>
  </Teleport>
</template>

<style scoped>
.gallery {
  position: relative;
}
.strip {
  display: flex;
  gap: var(--sp-2);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  padding-bottom: 0.5rem;
  overscroll-behavior-x: contain;
}
.shot {
  flex: 0 0 auto;
  width: 18rem;
  max-width: 80vw;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: 0;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--c-surface-2);
  cursor: zoom-in;
  scroll-snap-align: start;
}
.shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.shot:hover img {
  transform: scale(1.03);
}
.nav {
  position: absolute;
  top: calc(50% - 1.5rem);
  z-index: 2;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 50%;
  background: var(--c-overlay);
  color: #fff;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.85;
}
.nav.prev {
  left: -0.75rem;
}
.nav.next {
  right: -0.75rem;
}
@media (hover: none) {
  .nav {
    display: none;
  }
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 3.5rem;
  background: var(--c-overlay);
}
.lightbox img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius);
  box-shadow: var(--shadow-pop);
}
.lb-btn {
  position: absolute;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.15);
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
}
.lb-btn:hover {
  background: rgb(255 255 255 / 0.3);
}
.lb-close {
  top: 0.75rem;
  right: 0.75rem;
  font-size: 1.125rem;
}
.lb-prev {
  left: 0.5rem;
}
.lb-next {
  right: 0.5rem;
}
.lb-count {
  position: absolute;
  bottom: 0.75rem;
  color: #fff;
  font-size: 0.875rem;
}
@media (max-width: 40rem) {
  .lightbox {
    padding: 3.5rem 0.5rem;
  }
  .lb-prev,
  .lb-next {
    top: auto;
    bottom: 0.5rem;
  }
}
</style>
