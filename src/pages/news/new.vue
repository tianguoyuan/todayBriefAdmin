<script setup lang="ts">
  import type { NewsDraft } from '~/composables/newsStore'

  usePageTitle('新建新闻')

  const router = useRouter()
  const news = useNewsStore()

  function onSubmit(draft: NewsDraft) {
    news.createNews(draft)
    logAudit('create', '新闻', `新建新闻「${draft.title.slice(0, 20)}」`)
    router.push('/news')
  }

  function onCancel() {
    router.push('/news')
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">新建新闻</h2>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">填写内容后保存，保存成功将返回新闻列表。</p>
      </div>
      <RouterLink class="btn-ghost" to="/news">
        <div class="i-carbon-arrow-left" />
        返回列表
      </RouterLink>
    </div>
    <NewsForm @cancel="onCancel" @submit="onSubmit" />
  </div>
</template>
