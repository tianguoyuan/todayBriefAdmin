<script setup lang="ts">
  import { RouterLink } from 'vue-router'

  interface NewsItem {
    id: string
    title: string
    source: string
    reads: string
    time: string
    gradient: [string, string]
    status: 'published' | 'draft'
  }

  defineProps<{
    recentNews: NewsItem[]
  }>()
</script>

<template>
  <div class="p-5 card xl:col-span-2">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-bold">最近发布的新闻</h3>
      <RouterLink class="icon-btn text-sm flex gap-1 items-center" to="/news">
        查看全部
        <div class="i-carbon-arrow-right" />
      </RouterLink>
    </div>
    <ul class="divide-gray-100 divide-y dark:divide-gray-800">
      <li v-for="item in recentNews" :key="item.id" class="py-2.5 flex gap-3 items-center">
        <div
          class="rounded-full shrink-0 h-2.5 w-2.5"
          :style="{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }"
        />
        <div class="flex-1 min-w-0">
          <RouterLink class="text-sm font-medium block truncate hover:text-teal-600" :to="`/news/${item.id}`">
            {{ item.title }}
          </RouterLink>
          <p class="text-xs text-gray-400 mt-0.5 truncate">
            {{ item.source }} · {{ item.reads }} 阅读 · {{ item.time }}
          </p>
        </div>
        <span
          class="badge shrink-0"
          :class="
            item.status === 'published'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          "
        >
          {{ item.status === 'published' ? '已发布' : '草稿' }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
