<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { gameService } from '@/services/gameService'
import { ratingService } from '@/services/ratingService'
import { ApiError, isAbortError } from '@/services/api'
import { developerLine, formatDate } from '@/utils/format'
import { sanitizeDescription } from '@/utils/sanitize'
import { steamStoreUrl } from '@/utils/steam'
import MediaImage from '@/components/common/MediaImage.vue'
import GameTags from '@/components/games/GameTags.vue'
import GameScreenshots from '@/components/games/GameScreenshots.vue'
import GameReviews from '@/components/games/GameReviews.vue'
import AddToLibraryModal from '@/components/games/AddToLibraryModal.vue'
import EditGameModal from '@/components/games/EditGameModal.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { GameInfo, GameRating } from '@/types/api'

const props = defineProps<{ id: number }>()

const { locale, t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const game = shallowRef<GameInfo | null>(null)
const loading = ref(false)
const error = ref<unknown>(null)
const notFound = ref(false)
/** The user's library entry for this game (null = not in the library, undefined = unknown / guest) */
const entry = shallowRef<GameRating | null | undefined>(undefined)
const libraryOpen = ref(false)
/** Long Steam descriptions (with images/GIFs) start collapsed; clipped images aren't loaded until expanded */
const descriptionOpen = ref(false)
const editOpen = ref(false)
let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()
  const own = controller
  loading.value = true
  error.value = null
  notFound.value = false
  game.value = null
  entry.value = undefined
  descriptionOpen.value = false
  try {
    game.value = await gameService.get(props.id, own.signal)
    document.title = `${game.value.title} — GReSym`
    if (auth.isAuthenticated)
      entry.value = await ratingService.get(props.id, own.signal).catch(() => undefined)
  } catch (e) {
    if (isAbortError(e)) return
    // The API answers 400 for an unknown game id
    if (e instanceof ApiError && (e.status === 400 || e.status === 404)) notFound.value = true
    else error.value = e
  } finally {
    if (own === controller) loading.value = false
  }
}

watch(() => props.id, load, { immediate: true })
onBeforeUnmount(() => {
  controller?.abort()
  document.title = 'GReSym'
})

const developer = computed(() =>
  game.value ? developerLine(game.value.developer, game.value.publisher) : '',
)
const released = computed(() =>
  game.value ? formatDate(game.value.releaseDate, locale.value) : null,
)
const description = computed(() =>
  game.value?.description ? sanitizeDescription(game.value.description) : '',
)
const longDescription = computed(
  () => description.value.length > 1500 || description.value.includes('<img'),
)
const screenshots = computed(() => game.value?.screenshots ?? [])

function openLibrary() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  libraryOpen.value = true
}

function onEdited(updated: GameInfo) {
  // The PATCH response may come without screenshots: keep the ones already shown
  game.value = {
    ...game.value!,
    ...updated,
    screenshots: updated.screenshots ?? game.value!.screenshots,
  }
}

const libraryLabel = computed(() => (entry.value ? t('game.inLibrary') : t('game.addToLibrary')))
</script>

<template>
  <div class="page game-page">
    <LoadingIndicator v-if="loading" />
    <EmptyState v-else-if="notFound" :text="$t('game.notFound')">
      <RouterLink :to="{ name: 'search' }">{{ $t('game.toSearch') }}</RouterLink>
    </EmptyState>
    <ErrorMessage v-else-if="error" :error="error" retryable @retry="load" />

    <template v-else-if="game">
      <section class="info" aria-labelledby="game-title">
        <div class="left">
          <MediaImage :src="game.headerImageUrl" :alt="game.title" class="cover" />
          <GameTags :tags="game.tags" :max="16" />
        </div>

        <div class="right">
          <div class="head">
            <div class="meta">
              <h1 id="game-title">{{ game.title }}</h1>
              <p v-if="developer" class="muted">{{ developer }}</p>
              <p class="muted">{{ released ?? $t('game.dateUnknown') }}</p>
              <a
                v-if="game.steamAppId"
                class="small"
                :href="steamStoreUrl(game.steamAppId)"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ $t('game.steamPage') }} ↗
              </a>
            </div>
            <div class="actions">
              <button
                type="button"
                class="btn"
                :class="entry ? 'btn-ghost' : 'btn-primary'"
                @click="openLibrary"
              >
                {{ libraryLabel }}
              </button>
              <button
                v-if="auth.isAdmin"
                type="button"
                class="btn btn-ghost"
                @click="editOpen = true"
              >
                {{ $t('game.editInfo') }}
              </button>
            </div>
          </div>

          <!-- Sanitized (DOMPurify) Steam HTML -->
          <div v-if="description" class="description-wrap">
            <div
              class="description"
              :class="{ collapsed: longDescription && !descriptionOpen }"
              v-html="description"
            />
            <button
              v-if="longDescription"
              type="button"
              class="btn btn-sm btn-ghost"
              :aria-expanded="descriptionOpen"
              @click="descriptionOpen = !descriptionOpen"
            >
              {{ descriptionOpen ? $t('game.collapseDescription') : $t('game.expandDescription') }}
            </button>
          </div>
          <p v-else class="muted">{{ $t('game.noDescription') }}</p>
        </div>
      </section>

      <section class="section" aria-labelledby="shots-h">
        <h2 id="shots-h">{{ $t('game.screenshots') }}</h2>
        <GameScreenshots v-if="screenshots.length" :urls="screenshots" :title="game.title" />
        <EmptyState v-else :text="$t('game.noScreenshots')" />
      </section>

      <section class="section" aria-labelledby="reviews-h">
        <h2 id="reviews-h">{{ $t('game.reviews') }}</h2>
        <GameReviews :game-id="game.gameId" />
      </section>

      <AddToLibraryModal
        v-if="auth.isAuthenticated"
        :open="libraryOpen"
        :game-id="game.gameId"
        :title="game.title"
        @close="libraryOpen = false"
        @saved="entry = $event"
      />
      <EditGameModal
        v-if="auth.isAdmin"
        :open="editOpen"
        :game="game"
        @close="editOpen = false"
        @saved="onEdited"
      />
    </template>
  </div>
</template>

<style scoped>
.game-page {
  max-width: var(--w-game);
}
.info {
  display: grid;
  grid-template-columns: minmax(0, 33fr) minmax(0, 67fr);
  gap: var(--sp-3);
  align-items: start;
}
.left {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.right {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sp-2);
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.meta h1 {
  overflow-wrap: anywhere;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}
.description {
  overflow-wrap: anywhere;
  line-height: 1.6;
}
.description-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}
.description.collapsed {
  max-height: 22rem;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, #000 75%, transparent);
}
.description :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 0.5rem 0;
  border-radius: var(--radius);
}
.description :deep(h1),
.description :deep(h2) {
  margin: 1rem 0 0.5rem;
  font-size: 1.125rem;
}
.description :deep(ul) {
  padding-left: 1.25rem;
}
.description :deep(p) {
  margin: 0.5rem 0;
}

@media (max-width: 52rem) {
  .head {
    flex-direction: column;
  }
  .actions {
    justify-content: flex-start;
  }
}
@media (max-width: 40rem) {
  .info {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
