<script setup lang="ts">
  import { RouterLink } from 'vue-router'

  interface QuickLink {
    desc: string
    icon: string
    label: string
    to: string
  }

  defineProps<{
    quickLinks: QuickLink[]
  }>()
</script>

<template>
  <div class="p-5 card">
    <h3 class="text-base font-bold mb-4">快捷操作</h3>
    <ul class="gap-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2">
      <li v-for="link in quickLinks" :key="link.to">
        <RouterLink
          class="group p-3 border border-gray-200/80 rounded-xl flex flex-col gap-1.5 transition-colors dark:border-gray-700/80 hover:border-teal-400 hover:bg-teal-500/5"
          :to="link.to"
        >
          <div class="text-lg text-teal-600 dark:text-teal-400" :class="link.icon" />
          <p class="text-sm font-medium">{{ link.label }}</p>
          <p class="text-xs text-gray-400">{{ link.desc }}</p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
