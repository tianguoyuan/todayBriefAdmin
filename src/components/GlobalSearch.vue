<script setup lang="ts">
  import { refDebounced } from '@vueuse/core'

  const router = useRouter()
  const news = useNewsStore()
  const users = useUserStore()
  const categories = useCategoryStore()
  const comments = useCommentStore()

  const open = ref(false)
  const keyword = ref('')
  const keywordDebounced = refDebounced(keyword, 120)
  const inputRef = ref<HTMLElement | null>(null)
  const activeIndex = ref(0)

  interface SearchEntry {
    id: string
    kind: 'news' | 'user' | 'category' | 'comment'
    label: string
    detail: string
    to: string
    icon: string
  }

  const results = computed<SearchEntry[]>(() => {
    const kw = keywordDebounced.value.trim().toLowerCase()
    if (!kw) return []
    const entries: SearchEntry[] = []
    news.sortedNews().forEach((item) => {
      if ([item.title, item.source, item.tag].some((s) => s.toLowerCase().includes(kw))) {
        entries.push({
          detail: `${item.status === 'published' ? '已发布' : '草稿'} · ${item.category}`,
          icon: item.status === 'published' ? 'i-carbon-document' : 'i-carbon-document-blank',
          id: item.id,
          kind: 'news',
          label: item.title,
          to: `/news/${item.id}`,
        })
      }
    })
    users.list.value.forEach((user) => {
      if ([user.username, user.bio].some((s) => s.toLowerCase().includes(kw))) {
        entries.push({
          detail: `${user.role} · ${user.joinedAt}`,
          icon: 'i-carbon-user-avatar',
          id: user.id,
          kind: 'user',
          label: user.username,
          to: '/users',
        })
      }
    })
    categories.list.value.forEach((category) => {
      if (category.label.toLowerCase().includes(kw)) {
        entries.push({
          detail: '分类',
          icon: 'i-carbon-categories',
          id: category.id,
          kind: 'category',
          label: category.label,
          to: '/categories',
        })
      }
    })
    comments.sortedComments().forEach((comment) => {
      if ([comment.username, comment.content].some((s) => s.toLowerCase().includes(kw))) {
        entries.push({
          detail: `${comment.username} · ${comment.time}`,
          icon: 'i-carbon-chat',
          id: comment.id,
          kind: 'comment',
          label: comment.content.slice(0, 40),
          to: '/comments',
        })
      }
    })
    return entries.slice(0, 12)
  })

  function openSearch() {
    open.value = true
    keyword.value = ''
    activeIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }

  function closeSearch() {
    open.value = false
  }

  function select(entry: SearchEntry) {
    closeSearch()
    router.push(entry.to)
  }

  function onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      openSearch()
    }
    if (event.key === 'Escape' && open.value) closeSearch()
    if (!open.value) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % results.value.length
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
    }
    if (event.key === 'Enter' && results.value[activeIndex.value]) {
      event.preventDefault()
      select(results.value[activeIndex.value])
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  watch(open, (value) => {
    if (value) inputRef.value?.focus()
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="search">
      <div v-if="open" class="p-4 flex h-full w-full left-0 top-0 justify-center fixed z-[60] md:items-start">
        <div class="bg-black/40 inset-0 absolute backdrop-blur-sm" @click="closeSearch" />
        <div class="mt-20 rounded-xl bg-white max-w-lg w-full shadow-2xl relative overflow-hidden dark:bg-gray-900">
          <div class="px-4 border-b border-gray-100 flex gap-2 items-center dark:border-gray-800">
            <div class="text-gray-400">
              <div class="i-carbon-search" />
            </div>
            <input
              ref="inputRef"
              v-model="keyword"
              class="input px-0 flex-1 h-12 border-none! shadow-none! focus:ring-0!"
              placeholder="搜索新闻、用户、分类，评论…"
              type="text"
            />
            <kbd class="text-[10px] text-gray-400 px-1.5 py-0.5 border border-gray-200 rounded dark:border-gray-700">
              ESC
            </kbd>
          </div>
          <div class="p-2 max-h-80 overflow-y-auto">
            <p v-if="!keywordDebounced" class="text-xs text-gray-400 p-3">
              输入关键词开始搜索，按 Enter 跳转，↑↓ 选择。
            </p>
            <ul v-else-if="results.length" class="space-y-0.5">
              <li v-for="(entry, index) in results" :key="`${entry.kind}-${entry.id}`">
                <button
                  class="text-sm px-3 py-2.5 text-left rounded-lg flex gap-3 w-full transition-colors items-center"
                  :class="
                    index === activeIndex
                      ? 'bg-teal-600/10 text-teal-700 dark:text-teal-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  "
                  type="button"
                  @click="select(entry)"
                  @mousemove="activeIndex = index"
                >
                  <div class="text-base text-gray-400 shrink-0" :class="entry.icon" />
                  <div class="flex-1 min-w-0">
                    <p class="truncate">{{ entry.label }}</p>
                    <p class="text-[10px] text-gray-400 truncate">{{ entry.detail }}</p>
                  </div>
                  <span class="text-[10px] text-gray-400 shrink-0">
                    {{
                      entry.kind === 'news'
                        ? '新闻'
                        : entry.kind === 'user'
                          ? '用户'
                          : entry.kind === 'category'
                            ? '分类'
                            : '评论'
                    }}
                  </span>
                </button>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-400 p-4 text-center">没有匹配的结果</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .search-enter-active,
  .search-leave-active {
    transition: opacity 0.15s ease;
  }

  .search-enter-from,
  .search-leave-to {
    opacity: 0;
  }
</style>
