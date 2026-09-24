<script setup lang="ts">
  import type { NewsDraft } from '~/composables/newsStore'
  import { useToast } from '~/composables'

  usePageTitle('编辑新闻')

  const route = useRoute()
  const router = useRouter()
  const news = useNewsStore()

  const newId = (route.params as { id: string }).id
  const record = computed(() => news.getNewsById(newId))

  const draftSaved = ref(false)
  const { show: showTip, tip } = useToast()

  function onAutosave(draft: NewsDraft) {
    if (record.value) news.updateNews(newId, draft)
    draftSaved.value = true
    showTip('已自动保存草稿')
  }

  function onSubmit(draft: NewsDraft) {
    news.updateNews(newId, draft)
    logAudit('update', '新闻', `更新新闻「${draft.title.slice(0, 20)}」`)
    router.push('/news')
  }

  function onCancel() {
    router.push('/news')
  }
</script>

<template>
  <div v-if="record" class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">编辑新闻</h2>
        <p class="text-sm text-gray-500 mt-1 truncate dark:text-gray-400">
          {{ record.title }}
          <span v-if="draftSaved" class="text-emerald-500">（已自动保存）</span>
        </p>
      </div>
      <RouterLink class="btn-ghost" to="/news">
        <div class="i-carbon-arrow-left" />
        返回列表
      </RouterLink>
    </div>
    <NewsForm :initial="record" @autosave="onAutosave" @cancel="onCancel" @submit="onSubmit" />

    <Transition name="toast">
      <div
        v-if="tip"
        class="text-sm text-white px-4 py-2 rounded-full bg-gray-900 shadow-lg left-1/2 top-20 fixed z-50 dark:bg-gray-700 -translate-x-1/2"
      >
        {{ tip }}
      </div>
    </Transition>
  </div>
  <div v-else class="card">
    <EmptyState description="内容可能已被删除，或链接地址有误。" icon="i-carbon-document" title="新闻不存在">
      <RouterLink class="btn-ghost" to="/news">返回新闻列表</RouterLink>
    </EmptyState>
  </div>
</template>

<style scoped>
  .toast-enter-active,
  .toast-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translate(-50%, -8px);
  }
</style>
