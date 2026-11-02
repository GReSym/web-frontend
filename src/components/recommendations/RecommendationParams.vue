<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { DISLIKE_MODES, type DislikeMode, type RecommendationSettings } from '@/types/api'

// Recommendation tuning shared by the profile (saved defaults) and the recommendations page (one-request overrides).
// profile:          [Mainstream | Dislike strength] / [Dislike mode | explanation]
// recommendations:  [Limit | Mainstream | Dislike strength] / Show more / [Dislike mode | explanation]

const settings = defineModel<RecommendationSettings>({ required: true })
const limit = defineModel<number>('limit')
const props = withDefaults(
  defineProps<{ layout?: 'profile' | 'recommendations'; disabled?: boolean }>(),
  {
    layout: 'profile',
  },
)

const id = useId()
const showMore = ref(false)

function set<K extends keyof RecommendationSettings>(key: K, value: RecommendationSettings[K]) {
  settings.value = { ...settings.value, [key]: value }
}

function onLimit(e: Event) {
  const n = Math.round(Number((e.target as HTMLInputElement).value))
  if (Number.isFinite(n)) limit.value = n
}
function clampLimit() {
  if (limit.value === undefined) return
  limit.value = Math.min(100, Math.max(3, limit.value || 3))
}

const strengthUnused = computed(() => settings.value.dislikeMode === 'ignore')
const isRecs = computed(() => props.layout === 'recommendations')
</script>

<template>
  <div class="params" :class="layout">
    <div class="top">
      <div v-if="isRecs" class="field">
        <label :for="`${id}-limit`">{{ $t('params.limit') }}</label>
        <input
          :id="`${id}-limit`"
          class="input limit"
          type="number"
          min="3"
          max="100"
          step="1"
          inputmode="numeric"
          :value="limit"
          :disabled="disabled"
          @input="onLimit"
          @blur="clampLimit"
        />
      </div>

      <div class="field">
        <label :for="`${id}-main`">
          {{ $t('params.mainstream') }} <output class="value">{{ settings.mainstream }}</output>
        </label>
        <input
          :id="`${id}-main`"
          type="range"
          min="0"
          max="100"
          step="1"
          :value="settings.mainstream"
          :disabled="disabled"
          @input="set('mainstream', Number(($event.target as HTMLInputElement).value))"
        />
        <div class="ends small muted">
          <span>{{ $t('params.mainstreamLow') }}</span
          ><span>{{ $t('params.mainstreamHigh') }}</span>
        </div>
      </div>

      <div class="field">
        <label :for="`${id}-str`">
          {{ $t('params.dislikeStrength') }}
          <output class="value">{{ settings.dislikeStrength }}</output>
        </label>
        <input
          :id="`${id}-str`"
          type="range"
          min="0"
          max="100"
          step="1"
          :value="settings.dislikeStrength"
          :disabled="disabled"
          @input="set('dislikeStrength', Number(($event.target as HTMLInputElement).value))"
        />
        <div class="ends small muted">
          <span>{{ $t('params.strengthLow') }}</span>
          <span v-if="strengthUnused">{{ $t('params.strengthUnused') }}</span>
          <span>{{ $t('params.strengthHigh') }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="isRecs"
      type="button"
      class="more-btn"
      :aria-expanded="showMore"
      @click="showMore = !showMore"
    >
      {{ showMore ? $t('params.showLess') : $t('params.showMore') }} →
    </button>
    <div v-if="isRecs && showMore" class="more block small">
      <p>{{ $t('params.help.limit') }}</p>
      <p>{{ $t('params.help.mainstream') }}</p>
      <p>{{ $t('params.help.strength') }}</p>
      <p>{{ $t('params.help.override') }}</p>
    </div>

    <div class="bottom">
      <div class="field">
        <label :for="`${id}-mode`">{{ $t('params.dislikeMode') }}</label>
        <select
          :id="`${id}-mode`"
          class="select"
          :value="settings.dislikeMode"
          :disabled="disabled"
          @change="set('dislikeMode', ($event.target as HTMLSelectElement).value as DislikeMode)"
        >
          <option v-for="mode in DISLIKE_MODES" :key="mode" :value="mode">
            {{ $t(`params.modes.${mode}.name`) }}
          </option>
        </select>
      </div>
      <div class="explain small">
        <p>
          <strong>{{ $t(`params.modes.${settings.dislikeMode}.name`) }}:</strong>
          {{ $t(`params.modes.${settings.dislikeMode}.text`) }}
        </p>
        <p class="muted">{{ isRecs ? $t('params.overrideNote') : $t('params.defaultsNote') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.params {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2) var(--sp-3);
  align-items: start;
}
.recommendations .top {
  grid-template-columns: minmax(0, 0.6fr) 1fr 1fr;
}
.bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2) var(--sp-3);
  align-items: start;
}
.value {
  margin-left: 0.25rem;
  color: var(--c-accent);
  font-weight: 700;
}
.ends {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.limit {
  max-width: 7rem;
}
.explain {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-top: 1.5rem;
}
.more-btn {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-accent);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}
.more {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
@media (max-width: 40rem) {
  .top,
  .recommendations .top,
  .bottom {
    grid-template-columns: minmax(0, 1fr);
  }
  .explain {
    padding-top: 0;
  }
}
</style>
