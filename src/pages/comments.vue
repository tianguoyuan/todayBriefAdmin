<script setup lang="ts">
  import type { CommentStatus } from '~/composables/commentStore'
  import { useDebouncedSearch, useToast } from '~/composables'
  import { usePagination } from '~/composables/usePagination'
  import { exportXlsx } from '~/utils/exportXlsx'
  import { normalizeQueryParam } from '~/utils/params'

  usePageTitle('评论管理')

  const route = useRoute()
  const router = useRouter()
  const comments = useCommentStore()
  const news = useNewsStore()

  const { debounced: keywordDebounced, input: keyword } = useDebouncedSearch(
    typeof route.query.kw === 'string' ? route.query.kw : '',
  )
  const newsFilter = ref(
    normalizeQueryParam(
      route.query.news,
      news.list.value.map((item) => item.id),
      'all',
    ),
  )
  const statusFilter = ref(
    normalizeQueryParam<'all' | CommentStatus>(route.query.status, ['all', 'normal', 'hidden'], 'all'),
  )
  const readFilter = ref(
    normalizeQueryParam<'all' | 'read' | 'unread'>(route.query.read, ['all', 'read', 'unread'], 'all'),
  )

  const selectedIds = ref<Set<string>>(new Set())
  const pendingDeleteId = ref('')
  const pendingBulkDelete = ref(false)
  const { show: showTip, tip } = useToast()

  const newsById = computed(() => new Map(news.list.value.map((item) => [item.id, item])))

  const filtered = computed(() => {
    const kw = keywordDebounced.value.trim().toLowerCase()
    return comments.sortedComments().filter((comment) => {
      if (statusFilter.value !== 'all' && comment.status !== statusFilter.value) return false
      if (readFilter.value !== 'all' && comment.read !== (readFilter.value === 'read')) return false
      if (newsFilter.value !== 'all' && comment.newsId !== newsFilter.value) return false
      if (kw && ![comment.username, comment.content].some((s) => s.toLowerCase().includes(kw))) return false
      return true
    })
  })

  const { page, pageItems, total: filteredTotal, totalPages } = usePagination(filtered, 10)

  watch([keywordDebounced, newsFilter, statusFilter, readFilter], () => {
    selectedIds.value = new Set()
    syncToUrl()
  })

  function syncToUrl() {
    router.replace({
      query: {
        ...route.query,
        kw: keywordDebounced.value || undefined,
        news: newsFilter.value === 'all' ? undefined : newsFilter.value,
        read: readFilter.value === 'all' ? undefined : readFilter.value,
        status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      },
    })
  }

  const selectedCount = computed(() => selectedIds.value.size)
  const pageAllChecked = computed(
    () => pageItems.value.length > 0 && pageItems.value.every((item) => selectedIds.value.has(item.id)),
  )

  function toggleOne(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function togglePage() {
    const ids = pageItems.value.map((item) => item.id)
    const check = !pageAllChecked.value
    const next = new Set(selectedIds.value)
    ids.forEach((id) => {
      if (check) next.add(id)
      else next.delete(id)
    })
    selectedIds.value = next
  }

  function clearSelection() {
    selectedIds.value = new Set()
  }

  function confirmDelete() {
    if (pendingDeleteId.value) {
      comments.removeComment(pendingDeleteId.value)
      logAudit('delete', '评论', '删除一条评论')
    }
    pendingDeleteId.value = ''
  }

  function bulkSetStatus(status: CommentStatus) {
    comments.bulkSetCommentStatus(selectedIds.value, status)
    logAudit('update', '评论', `批量${status === 'hidden' ? '隐藏' : '显示'} ${selectedCount.value} 条评论`)
    clearSelection()
  }

  function bulkMarkRead() {
    const count = selectedCount.value
    comments.bulkMarkCommentsRead(selectedIds.value, true)
    logAudit('update', '评论', `批量标记 ${count} 条评论已读`)
    clearSelection()
    showTip(`已将 ${count} 条评论标记为已读`)
  }

  function markOne(id: string) {
    comments.markCommentRead(id)
    logAudit('update', '评论', '标记一条评论已读')
  }

  function toggleStatus(id: string) {
    const comment = comments.list.value.find((item) => item.id === id)
    comments.toggleCommentStatus(id)
    if (comment) logAudit('update', '评论', `${comment.status === 'hidden' ? '显示' : '隐藏'}一条评论`)
  }

  function confirmBulkDelete() {
    const count = selectedCount.value
    comments.bulkRemoveComments(selectedIds.value)
    logAudit('delete', '评论', `批量删除 ${count} 条评论`)
    pendingBulkDelete.value = false
    clearSelection()
  }

  function exportFiltered() {
    const rows = filtered.value.map((comment) => [
      comment.username,
      comment.content.replaceAll('\n', ' '),
      newsById.value.get(comment.newsId)?.title ?? '',
      comment.status === 'hidden' ? '已隐藏' : '正常',
      comment.time,
      comment.likes,
      comment.parentId ? `回复 @${comment.replyTo ?? ''}` : '',
    ])
    exportXlsx(
      `评论列表-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['用户', '内容', '所属新闻', '状态', '时间', '点赞', '类型'],
      rows,
      '评论列表',
    )
    showTip('已导出当前筛选结果')
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">评论管理</h2>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">
          共 {{ comments.total }} 条评论 · 未读 {{ comments.unreadCount }} · 已隐藏 {{ comments.hiddenCount }} ·
          累计获赞 {{ comments.totalLikes }}
        </p>
      </div>
    </div>

    <div class="p-4 card flex flex-wrap gap-3 items-center">
      <div class="flex-1 min-w-52 relative">
        <div class="text-gray-400 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2">
          <div class="i-carbon-search" />
        </div>
        <input v-model="keyword" class="input pl-9" placeholder="搜索用户或评论内容" type="text" />
      </div>
      <select v-model="newsFilter" class="input min-w-48 w-auto">
        <option value="all">全部新闻</option>
        <option v-for="item in news.list.value" :key="item.id" :value="item.id">
          {{ item.title.slice(0, 14) }}{{ item.title.length > 14 ? '…' : '' }}
        </option>
      </select>
      <select v-model="statusFilter" class="input min-w-32 w-auto">
        <option value="all">全部状态</option>
        <option value="normal">正常</option>
        <option value="hidden">已隐藏</option>
      </select>
      <select v-model="readFilter" class="input min-w-32 w-auto">
        <option value="all">全部阅读状态</option>
        <option value="unread">未读</option>
        <option value="read">已读</option>
      </select>
      <span class="text-xs text-gray-400">筛选出 {{ filteredTotal }} 条</span>
      <button class="btn-ghost text-xs" type="button" @click="exportFiltered">
        <div class="i-carbon-download" />
        导出当前结果
      </button>
    </div>

    <Transition name="page">
      <div v-if="selectedCount > 0" class="p-4 card border-teal-500/30 flex flex-wrap gap-3 items-center">
        <span class="text-sm text-teal-600 font-medium dark:text-teal-400">已选择 {{ selectedCount }} 条</span>
        <div class="flex flex-wrap gap-2">
          <button class="btn text-xs" type="button" @click="bulkMarkRead">
            <div class="i-carbon-checkmark" />
            批量标记已读
          </button>
          <button class="btn text-xs" type="button" @click="bulkSetStatus('normal')">
            <div class="i-carbon-user-online" />
            批量显示
          </button>
          <button class="btn-ghost text-xs" type="button" @click="bulkSetStatus('hidden')">
            <div class="i-carbon-user-minus" />
            批量隐藏
          </button>
          <button class="btn-danger text-xs" type="button" @click="pendingBulkDelete = true">
            <div class="i-carbon-trash-can" />
            批量删除
          </button>
          <button class="btn-ghost text-xs" type="button" @click="clearSelection">
            <div class="i-carbon-close" />
            取消选择
          </button>
        </div>
      </div>
    </Transition>

    <div class="card overflow-hidden">
      <div v-if="pageItems.length" class="overflow-x-auto">
        <table class="text-sm text-left min-w-200 w-full">
          <thead>
            <tr class="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th class="font-medium px-4 py-3 w-10">
                <input
                  aria-label="全选当前页"
                  :checked="pageAllChecked"
                  class="accent-teal-600"
                  type="checkbox"
                  @change="togglePage"
                />
              </th>
              <th class="font-medium px-4 py-3">用户</th>
              <th class="font-medium px-4 py-3">评论内容</th>
              <th class="font-medium px-4 py-3">所属新闻</th>
              <th class="font-medium px-4 py-3">时间</th>
              <th class="font-medium px-4 py-3">点赞</th>
              <th class="font-medium px-4 py-3">状态</th>
              <th class="font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-gray-100 divide-y dark:divide-gray-800">
            <tr
              v-for="comment in pageItems"
              :key="comment.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              :class="comment.status === 'hidden' ? 'opacity-60' : ''"
            >
              <td class="px-4 py-3">
                <input
                  :aria-label="`选择 ${comment.username} 的评论`"
                  :checked="selectedIds.has(comment.id)"
                  class="accent-teal-600"
                  type="checkbox"
                  @change="toggleOne(comment.id)"
                />
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex gap-2 items-center">
                  <div
                    class="text-xs text-white font-bold rounded-full shrink-0 grid h-8 w-8 place-items-center"
                    :style="{ background: `linear-gradient(135deg, ${comment.avatar[0]}, ${comment.avatar[1]})` }"
                  >
                    {{ comment.username.slice(0, 1) }}
                  </div>
                  <span class="font-medium">{{ comment.username }}</span>
                  <span
                    v-if="!comment.read"
                    class="rounded-full bg-amber-500 shrink-0 h-2 w-2 inline-block"
                    title="未读"
                  />
                </div>
              </td>
              <td class="px-4 py-3 max-w-md">
                <p class="text-gray-700 line-clamp-1 dark:text-gray-300">
                  <span
                    v-if="comment.parentId"
                    class="text-xs text-gray-500 mr-1 px-1.5 py-0.5 rounded bg-gray-100 dark:text-gray-400 dark:bg-gray-800"
                  >
                    回复 @{{ comment.replyTo }}
                  </span>
                  {{ comment.content }}
                </p>
              </td>
              <td class="px-4 py-3 max-w-56">
                <RouterLink
                  v-if="newsById.get(comment.newsId)"
                  class="text-xs text-gray-500 line-clamp-1 dark:text-gray-400 hover:text-teal-600"
                  :to="`/news/${comment.newsId}`"
                >
                  {{ newsById.get(comment.newsId)!.title }}
                </RouterLink>
                <span v-else class="text-xs text-gray-400">已删除的新闻</span>
              </td>
              <td class="text-xs text-gray-400 px-4 py-3 whitespace-nowrap">{{ comment.time }}</td>
              <td class="text-orange-500 px-4 py-3 whitespace-nowrap">{{ comment.likes }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <button
                  class="badge cursor-pointer transition-colors"
                  :class="
                    comment.status === 'normal'
                      ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-gray-200/70 text-gray-500 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400'
                  "
                  type="button"
                  @click="toggleStatus(comment.id)"
                >
                  {{ comment.status === 'normal' ? '正常' : '已隐藏' }}
                </button>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-xs flex gap-1.5 items-center">
                  <button
                    v-if="!comment.read"
                    class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    type="button"
                    @click="markOne(comment.id)"
                  >
                    <div class="i-carbon-checkmark" />
                    已读
                  </button>
                  <button
                    class="icon-btn text-red-500 px-2 py-1 rounded-md flex gap-1 items-center hover:bg-red-500/10"
                    type="button"
                    @click="pendingDeleteId = comment.id"
                  >
                    <div class="i-carbon-trash-can" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else description="试试调整筛选条件。" icon="i-carbon-chat-off" title="没有匹配的评论" />
      <Pagination v-if="pageItems.length" v-model:page="page" :total="filteredTotal" :totalPages="totalPages" />
    </div>

    <ModalDialog
      cancelText="取消"
      confirmText="删除"
      danger
      :open="Boolean(pendingDeleteId)"
      title="删除评论"
      @cancel="pendingDeleteId = ''"
      @confirm="confirmDelete"
    >
      删除后该评论无法恢复。确定继续吗？
    </ModalDialog>

    <ModalDialog
      cancelText="取消"
      confirmText="删除"
      danger
      :open="pendingBulkDelete"
      title="批量删除评论"
      @cancel="pendingBulkDelete = false"
      @confirm="confirmBulkDelete"
    >
      将删除已选的 {{ selectedCount }} 条评论，且无法恢复。确定继续吗？
    </ModalDialog>

    <Transition name="toast">
      <div
        v-if="tip"
        class="text-sm text-white px-4 py-2 rounded-full bg-gray-900 shadow-lg left-1/2 top-20 fixed z-50 dark:bg-gray-700 -translate-x-1/2"
      >
        {{ tip }}
      </div>
    </Transition>
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
