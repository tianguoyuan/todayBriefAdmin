<script setup lang="ts">
  withDefaults(
    defineProps<{
      label: string
      value: string | number
      icon?: string
      tone?: string
      hint?: string
    }>(),
    {
      hint: '',
      icon: '',
      tone: 'bg-teal-500',
    },
  )
</script>

<template>
  <div class="p-4 card flex gap-4 items-center">
    <div
      v-if="icon"
      class="text-xl text-white rounded-xl shrink-0 grid h-11 w-11 shadow-sm place-items-center"
      :class="tone"
    >
      <div :class="icon" />
    </div>
    <div class="min-w-0">
      <p class="text-2xl leading-none font-bold">{{ value }}</p>
      <p class="text-xs text-gray-500 mt-1.5 truncate dark:text-gray-400">{{ label }}</p>
      <p v-if="hint" class="text-xs text-gray-400 mt-0.5">{{ hint }}</p>
    </div>
  </div>
</template>
