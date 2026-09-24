<script setup lang="ts">
  interface Props {
    trendRange: 7 | 30
    days: number
    avgPerDay: string
    peakCount: number
    onRangeChange: (range: 7 | 30) => void
  }

  defineProps<Props>()

  const emit = defineEmits<{
    rangeChange: [range: 7 | 30]
  }>()
</script>

<template>
  <div class="mb-5 flex gap-4 items-center justify-between">
    <div>
      <h3 class="text-base font-bold flex gap-2 items-center">
        <div class="i-carbon-chart-line text-lg text-teal-500" />
        发布趋势
      </h3>
      <p class="text-xs text-gray-400 mt-1">
        近 {{ trendRange }} 天共发布
        <span class="text-teal-600 font-medium dark:text-teal-400">{{ days }}</span>
        条 · 日均 {{ avgPerDay }} 条
      </p>
    </div>
    <div class="p-1 rounded-lg bg-gray-100 flex gap-1 dark:bg-gray-800">
      <button
        class="text-xs font-medium px-2.5 py-1 rounded-md transition-all"
        :class="
          trendRange === 7
            ? 'bg-white text-teal-600 shadow-sm dark:bg-gray-700 dark:text-teal-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        "
        type="button"
        @click="emit('rangeChange', 7)"
      >
        7 天
      </button>
      <button
        class="text-xs font-medium px-2.5 py-1 rounded-md transition-all"
        :class="
          trendRange === 30
            ? 'bg-white text-teal-600 shadow-sm dark:bg-gray-700 dark:text-teal-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        "
        type="button"
        @click="emit('rangeChange', 30)"
      >
        30 天
      </button>
    </div>
  </div>

  <div class="text-[10px] text-gray-400 mb-3 flex items-center justify-between">
    <span>峰值 {{ peakCount }} 条</span>
    <div class="flex gap-3">
      <span class="flex gap-1 items-center">
        <span class="rounded-full h-1.5 w-1.5" style="background: linear-gradient(90deg, #14b8a6, #0ea5e9)" />
        发布量
      </span>
      <span class="flex gap-1 items-center">
        <span class="rounded-full bg-amber-500 h-1.5 w-1.5" />
        峰值日
      </span>
    </div>
  </div>
</template>

<style scoped></style>
