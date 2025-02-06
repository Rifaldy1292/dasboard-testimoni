<script setup lang="ts">
import { ref } from 'vue'
import { GChart } from 'vue-google-charts'

const columns = [
  { type: 'string', id: 'President' },
  { type: 'date', id: 'Start' },
  { type: 'date', id: 'End' }
]

const rows = [
  ['Washington', new Date(1789, 3, 30), new Date(1797, 2, 4)],
  ['Adams', new Date(1797, 2, 4), new Date(1801, 2, 4)],
  ['Jefferson', new Date(1801, 2, 4), new Date(1809, 2, 4)]
]

const data = ref([columns, ...rows])

const options = ref({
  width: 800,
  height: 600
})
</script>

<template>
  <GChart :data="data" :options="options" type="Timeline" :settings="{ packages: ['timeline'] }" />
</template>
