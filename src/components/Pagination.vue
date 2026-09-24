<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      page: number
      total: number
      totalPages: number
    }>(),
    {},
  )

  const emit = defineEmits<{
    'update:page': [page: number]
  }>()

  const pages = computed<(number | '…')[]>(() => {
    const { page, totalPages } = props
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const candidates = new Set([1, totalPages, page - 1, page, page + 1])
    const sorted = [...candidates].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
    const result: (number | '…')[] = []
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
      result.push(sorted[i])
    }
    return result
  })

  function go(next: number) {
    const clamped = Math.min(props.totalPages, Math.max(1, next))
    emit('update:page', clamped)
  }
</script>

<template>
  <div class="text-sm px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
    <p class="text-xs text-gray-400">共 {{ total }} 条 · 第 {{ page }} / {{ totalPages }} 页</p>
    <div class="flex gap-1 items-center">
      <button
        class="icon-btn px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800 disabled:hover:bg-transparent"
        :disabled="page <= 1"
        title="上一页"
        type="button"
        @click="go(page - 1)"
      >
        <div class="i-carbon-chevron-left" />
      </button>
      <button
        v-for="(p, i) in pages"
        :key="`${p}-${i}`"
        class="text-xs px-2 py-1 rounded-md min-w-8 transition-colors"
        :class="
          p === page
            ? 'bg-teal-600 font-medium text-white'
            : p === '…'
              ? 'cursor-default text-gray-400'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        "
        :disabled="p === '…'"
        type="button"
        @click="go(p as number)"
      >
        {{ p }}
      </button>
      <button
        class="icon-btn px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800 disabled:hover:bg-transparent"
        :disabled="page >= totalPages"
        title="下一页"
        type="button"
        @click="go(page + 1)"
      >
        <div class="i-carbon-chevron-right" />
      </button>
    </div>
  </div>
</template>
