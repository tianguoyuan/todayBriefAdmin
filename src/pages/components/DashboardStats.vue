<script setup lang="ts">
  import StatCard from '~/components/StatCard.vue'

  interface Stat {
    label: string
    value: number
    icon: string
    tone: string
    hint: string
  }

  defineProps<{
    stats: Stat[]
  }>()
</script>

<template>
  <div class="gap-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
    <StatCard v-for="stat in stats" :key="stat.label" v-bind="stat" />
  </div>
</template>

<style scoped></style>
