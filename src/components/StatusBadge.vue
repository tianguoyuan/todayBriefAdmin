<script setup lang="ts">
  withDefaults(
    defineProps<{
      label: string
      tone?: 'green' | 'amber' | 'red' | 'gray' | 'sky'
    }>(),
    {
      tone: 'gray',
    },
  )
</script>

<template>
  <span
    class="badge"
    :class="{
      'bg-sky-500/10 text-sky-600 dark:text-sky-400': tone === 'sky',
      'bg-amber-500/10 text-amber-600 dark:text-amber-400': tone === 'amber',
      'bg-red-500/10 text-red-500': tone === 'red',
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400': tone === 'green',
      'bg-gray-500/10 text-gray-500 dark:text-gray-400': tone === 'gray',
    }"
  >
    {{ label }}
  </span>
</template>
