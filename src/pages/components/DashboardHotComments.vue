<script setup lang="ts">
  interface CommentItem {
    id: string
    username: string
    content: string
    likes: number
    avatar: [string, string]
  }

  defineProps<{
    hotComments: CommentItem[]
  }>()
</script>

<template>
  <div class="p-5 card">
    <h3 class="text-base font-bold mb-4">热门评论</h3>
    <ul class="space-y-3">
      <li v-for="comment in hotComments" :key="comment.id" class="flex gap-3">
        <div
          class="text-xs text-white font-bold rounded-full shrink-0 grid h-8 w-8 place-items-center"
          :style="{ background: `linear-gradient(135deg, ${comment.avatar[0]}, ${comment.avatar[1]})` }"
        >
          {{ comment.username.slice(0, 1) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs flex gap-2 items-baseline">
            <span class="font-medium">{{ comment.username }}</span>
            <span class="text-orange-500 flex gap-0.5 items-center">
              <div class="i-carbon-favorite" />
              {{ comment.likes }}
            </span>
          </p>
          <p class="text-sm text-gray-600 mt-0.5 truncate dark:text-gray-300">{{ comment.content }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
