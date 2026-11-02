<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// One node of the JSON viewer (recursive). Objects/arrays fold; long arrays are shown in chunks.

const props = withDefaults(
  defineProps<{
    value: unknown
    name?: string | number
    depth?: number
    openDepth?: number
    last?: boolean
  }>(),
  { name: undefined, depth: 0, openDepth: 2, last: true },
)

const { t } = useI18n()
const CHUNK = 50
const open = ref(props.depth < props.openDepth)
const shown = ref(CHUNK)

const isArray = computed(() => Array.isArray(props.value))
const isObject = computed(() => props.value !== null && typeof props.value === 'object')
const entries = computed<[string | number, unknown][]>(() => {
  if (!isObject.value) return []
  return isArray.value
    ? (props.value as unknown[]).map((v, i) => [i, v])
    : Object.entries(props.value as Record<string, unknown>)
})
const visible = computed(() => entries.value.slice(0, shown.value))
const brackets = computed(() => (isArray.value ? ['[', ']'] : ['{', '}']))
const summary = computed(() =>
  isArray.value
    ? t('json.items', { n: entries.value.length })
    : t('json.keys', { n: entries.value.length }),
)
const primitiveClass = computed(() => (props.value === null ? 'null' : typeof props.value))
const primitiveText = computed(() =>
  typeof props.value === 'string' ? JSON.stringify(props.value) : String(props.value),
)
</script>

<template>
  <div class="node">
    <template v-if="isObject">
      <button type="button" class="fold" :aria-expanded="open" @click="open = !open">
        <span class="arrow">{{ open ? '▾' : '▸' }}</span>
        <span v-if="name !== undefined" class="key"
          >{{ typeof name === 'string' ? `"${name}"` : name }}:
        </span>
        <span class="punct">{{ brackets[0] }}</span>
        <span v-if="!open" class="summary"> {{ summary }} </span>
        <span v-if="!open" class="punct">{{ brackets[1] }}{{ last ? '' : ',' }}</span>
      </button>
      <div v-if="open" class="children">
        <JsonNode
          v-for="([k, v], i) in visible"
          :key="k"
          :name="isArray ? undefined : k"
          :value="v"
          :depth="depth + 1"
          :open-depth="openDepth"
          :last="i === entries.length - 1"
        />
        <button v-if="shown < entries.length" type="button" class="more" @click="shown += CHUNK">
          … {{ $t('json.more', { n: entries.length - shown }) }}
        </button>
      </div>
      <span v-if="open" class="punct close">{{ brackets[1] }}{{ last ? '' : ',' }}</span>
    </template>
    <template v-else>
      <span class="leaf">
        <span v-if="name !== undefined" class="key">"{{ name }}": </span>
        <span :class="primitiveClass">{{ primitiveText }}</span
        ><span class="punct">{{ last ? '' : ',' }}</span>
      </span>
    </template>
  </div>
</template>

<style scoped>
.node {
  line-height: 1.5;
}
.fold {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.arrow {
  display: inline-block;
  width: 1em;
  color: var(--c-text-muted);
}
.children {
  padding-left: 1.25em;
  border-left: 1px dotted var(--c-border);
  margin-left: 0.4em;
}
.close {
  padding-left: 1em;
}
.leaf {
  padding-left: 1em;
  overflow-wrap: anywhere;
}
.key {
  color: var(--c-accent);
}
.summary {
  color: var(--c-text-muted);
  font-style: italic;
}
.string {
  color: var(--c-positive);
}
.number {
  color: var(--c-warning);
}
.boolean,
.null {
  color: var(--c-negative);
}
.more {
  margin-left: 1em;
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-accent);
  font: inherit;
  cursor: pointer;
}
</style>
