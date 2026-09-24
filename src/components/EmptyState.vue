<script setup lang="ts">
  withDefaults(
    defineProps<{
      icon?: string
      title?: string
      description?: string
    }>(),
    {
      description: '',
      icon: 'i-carbon-warning-alt',
      title: '暂无数据',
    },
  )
</script>

<template>
  <div class="py-16 text-center flex flex-col gap-3 items-center justify-center">
    <div class="text-2xl text-gray-400 rounded-full bg-gray-100 grid h-14 w-14 place-items-center dark:bg-gray-800">
      <div :class="icon" />
    </div>
    <p class="text-sm text-gray-500 font-medium dark:text-gray-400">{{ title }}</p>
    <p v-if="description" class="text-xs text-gray-400 max-w-xs">{{ description }}</p>
    <div v-if="$slots.default" class="mt-1">
      <slot />
    </div>
  </div>
</template>
