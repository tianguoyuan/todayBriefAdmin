<script setup lang="ts">
  interface CategoryStat {
    category: {
      id: string
      label: string
      color: [string, string]
    }
    count: number
    percent: number
  }

  defineProps<{
    categoryStats: CategoryStat[]
  }>()
</script>

<template>
  <div class="p-5 card">
    <h3 class="text-base font-bold mb-4">分类分布</h3>
    <ul class="space-y-3">
      <li v-for="stat in categoryStats" :key="stat.category.id">
        <div class="text-xs mb-1 flex items-center justify-between">
          <span class="flex gap-1.5 items-center">
            <span
              class="rounded-full h-2.5 w-2.5"
              :style="{ background: `linear-gradient(135deg, ${stat.category.color[0]}, ${stat.category.color[1]})` }"
            />
            {{ stat.category.label }}
          </span>
          <span class="text-gray-400">{{ stat.count }} 条 · {{ stat.percent }}%</span>
        </div>
        <div class="rounded-full bg-gray-100 h-1.5 overflow-hidden dark:bg-gray-800">
          <div
            class="rounded-full h-full transition-all"
            :style="{
              width: `${stat.percent}%`,
              background: `linear-gradient(90deg, ${stat.category.color[0]}, ${stat.category.color[1]})`,
            }"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
