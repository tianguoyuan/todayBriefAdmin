<script setup lang="ts">
  import type { NewsStatus } from '~/composables/newsStore'
  import { useDebouncedSearch, useToast } from '~/composables'
  import { usePagination } from '~/composables/usePagination'
  import { exportXlsx } from '~/utils/exportXlsx'
  import { normalizeQueryParam } from '~/utils/params'

  usePageTitle('新闻管理')

  const route = useRoute()
  const router = useRouter()
  const news = useNewsStore()
  const categories = useCategoryStore()
  const comments = useCommentStore()

  const { debounced: keywordDebounced, input: keyword } = useDebouncedSearch(
    typeof route.query.kw === 'string' ? route.query.kw : '',
  )
  const categoryFilter = ref(
    normalizeQueryParam(
      route.query.category,
      categories.newsCategories.value.map((c) => c.id),
      'all',
    ),
  )
  const statusFilter = ref(
    normalizeQueryParam<'all' | NewsStatus>(route.query.status, ['all', 'published', 'draft'], 'all'),
  )

  const selectedIds = ref<Set<string>>(new Set())
  const pendingDeleteId = ref('')
  const pendingBulkDelete = ref(false)
  const pendingEmptyTrash = ref(false)
  const trashOpen = ref(false)
  const { show: showTip, tip } = useToast()

  const filtered = computed(() => {
    const kw = keywordDebounced.value.trim().toLowerCase()
    return news.sortedNews().filter((item) => {
      if (categoryFilter.value !== 'all' && item.category !== categoryFilter.value) return false
      if (statusFilter.value !== 'all' && item.status !== statusFilter.value) return false
      if (kw && ![item.title, item.source, item.tag].some((s) => s.toLowerCase().includes(kw))) return false
      return true
    })
  })

  const { page, pageItems, total: filteredTotal, totalPages } = usePagination(filtered, 10)

  watch([keywordDebounced, categoryFilter, statusFilter], () => {
    selectedIds.value = new Set()
    syncToUrl()
  })

  function syncToUrl() {
    router.replace({
      query: {
        ...route.query,
        category: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
        kw: keywordDebounced.value || undefined,
        status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      },
    })
  }

  const selectedCount = computed(() => selectedIds.value.size)
  const pageAllChecked = computed(
    () => pageItems.value.length > 0 && pageItems.value.every((item) => selectedIds.value.has(item.id)),
  )

  function categoryOf(id: string) {
    return categories.getCategoryById(id)
  }

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

  function cloneToDraft(id: string) {
    const copy = news.cloneNews(id)
    if (copy) {
      selectedIds.value = new Set()
      logAudit('create', '新闻', `复制「${copy.title.slice(0, 20)}」为草稿`)
      showTip(`已复制「${copy.title.slice(0, 20)}…」为草稿`)
    }
  }

  function exportFiltered() {
    const rows = filtered.value.map((item) => [
      item.title,
      categories.newsCategories.value.find((c) => c.id === item.category)?.label ?? item.category,
      item.status === 'published' ? '已发布' : '草稿',
      item.pinned ? '是' : '否',
      item.reads,
      item.time,
      item.source,
      item.tag ?? '',
      item.summary,
    ])
    exportXlsx(
      `新闻列表-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['标题', '分类', '状态', '置顶', '阅读', '时间', '来源', '标签', '摘要'],
      rows,
      '新闻列表',
    )
    logAudit('export', '新闻', `导出新闻列表 Excel（${rows.length} 条）`)
    showTip('已导出当前筛选结果')
  }

  function confirmDelete() {
    if (pendingDeleteId.value) {
      const record = news.getNewsById(pendingDeleteId.value)
      news.softDeleteNews(pendingDeleteId.value)
      if (record) logAudit('delete', '新闻', `移入回收站「${record.title.slice(0, 20)}」`)
      showTip('已移入回收站，可在回收站恢复')
    }
    pendingDeleteId.value = ''
  }

  function bulkSetStatus(status: NewsStatus) {
    news.bulkSetNewsStatus(selectedIds.value, status)
    logAudit(
      status === 'published' ? 'publish' : 'update',
      '新闻',
      `批量${status === 'published' ? '发布' : '转为草稿'} ${selectedCount.value} 条新闻`,
    )
    clearSelection()
  }

  function confirmBulkDelete() {
    const ids = [...selectedIds.value]
    const count = ids.length
    news.bulkSoftDeleteNews(ids)
    logAudit('delete', '新闻', `批量移入回收站 ${count} 条新闻`)
    pendingBulkDelete.value = false
    clearSelection()
    showTip(`已将 ${count} 条新闻移入回收站`)
  }

  function confirmEmptyTrash() {
    const count = news.trashCount.value
    const ids = news.trashedNews.value.map((item) => item.id)
    news.emptyTrash()
    ids.forEach((id) => comments.removeCommentsByNews(id))
    logAudit('delete', '新闻', `清空回收站 ${count} 条新闻`)
    pendingEmptyTrash.value = false
    showTip('回收站已清空')
  }

  function restoreOne(id: string) {
    const record = news.trashedNews.value.find((item) => item.id === id)
    news.restoreNews(id)
    if (record) logAudit('restore', '新闻', `恢复新闻「${record.title.slice(0, 20)}」`)
    showTip('已从回收站恢复')
  }

  function togglePinned(id: string) {
    const record = news.getNewsById(id)
    news.togglePinned(id)
    if (record) logAudit('update', '新闻', `${record.pinned ? '取消置顶' : '置顶'}「${record.title.slice(0, 20)}」`)
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">新闻管理</h2>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">
          共 {{ news.total }} 条内容 · 已发布 {{ news.publishedCount }} · 草稿 {{ news.draftCount }}
        </p>
      </div>
      <RouterLink class="btn" to="/news/new">
        <div class="i-carbon-add" />
        新建新闻
      </RouterLink>
    </div>

    <div class="p-4 card flex flex-wrap gap-3 items-center">
      <div class="flex-1 min-w-52 relative">
        <div class="text-gray-400 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2">
          <div class="i-carbon-search" />
        </div>
        <input v-model="keyword" class="input pl-9" placeholder="搜索标题 / 来源 / 标签（自动防抖）" type="text" />
      </div>
      <select v-model="categoryFilter" class="input min-w-32 w-auto">
        <option value="all">全部分类</option>
        <option v-for="category in categories.newsCategories.value" :key="category.id" :value="category.id">
          {{ category.label }}
        </option>
      </select>
      <select v-model="statusFilter" class="input min-w-32 w-auto">
        <option value="all">全部状态</option>
        <option value="published">已发布</option>
        <option value="draft">草稿</option>
      </select>
      <span class="text-xs text-gray-400">{{ filteredTotal }} / {{ news.total }} 条</span>
      <button class="btn-ghost text-xs" type="button" @click="exportFiltered">
        <div class="i-carbon-download" />
        导出当前结果
      </button>
    </div>

    <Transition name="page">
      <div v-if="selectedCount > 0" class="p-4 card border-teal-500/30 flex flex-wrap gap-3 items-center">
        <span class="text-sm text-teal-600 font-medium dark:text-teal-400">已选择 {{ selectedCount }} 条</span>
        <div class="flex flex-wrap gap-2">
          <button class="btn text-xs" type="button" @click="bulkSetStatus('published')">
            <div class="i-carbon-checkmark-outline" />
            批量发布
          </button>
          <button class="btn-ghost text-xs" type="button" @click="bulkSetStatus('draft')">
            <div class="i-carbon-document-blank" />
            批量转草稿
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
      <div
        class="text-sm px-4 py-3 border-b border-gray-100 flex gap-3 items-center justify-between dark:border-gray-800"
      >
        <button
          class="icon-btn text-xs px-2 py-1 rounded-md flex gap-1.5 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
          type="button"
          @click="trashOpen = !trashOpen"
        >
          <div class="i-carbon-restart" />
          回收站
          <span v-if="news.trashCount.value > 0" class="badge text-red-600 bg-red-500/10 dark:text-red-400">
            {{ news.trashCount }}
          </span>
        </button>
        <button
          v-if="trashOpen && news.trashCount.value > 0"
          class="btn-danger text-xs"
          type="button"
          @click="pendingEmptyTrash = true"
        >
          <div class="i-carbon-trash-can" />
          清空回收站
        </button>
      </div>

      <Transition name="page">
        <div v-if="trashOpen && news.trashedNews.value.length" class="overflow-x-auto">
          <table class="text-sm text-left min-w-160 w-full">
            <thead>
              <tr class="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th class="font-medium px-4 py-3">标题</th>
                <th class="font-medium px-4 py-3">分类</th>
                <th class="font-medium px-4 py-3">状态</th>
                <th class="font-medium px-4 py-3">删除时间</th>
                <th class="font-medium px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody class="divide-gray-100 divide-y dark:divide-gray-800">
              <tr
                v-for="item in news.trashedNews.value"
                :key="item.id"
                class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td class="text-gray-600 px-4 py-3 max-w-lg line-clamp-1 dark:text-gray-300">
                  <RouterLink class="hover:text-teal-600" :to="`/news/${item.id}`">
                    {{ item.title }}
                  </RouterLink>
                </td>
                <td class="px-4 py-3">
                  <span
                    v-if="categoryOf(item.category)"
                    class="badge text-white"
                    :style="{
                      background: `linear-gradient(135deg, ${categoryOf(item.category)!.color[0]}, ${categoryOf(item.category)!.color[1]})`,
                    }"
                  >
                    {{ categoryOf(item.category)!.label }}
                  </span>
                  <span v-else class="badge text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-800">
                    {{ item.category }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <StatusBadge
                    :label="item.status === 'published' ? '已发布' : '草稿'"
                    :tone="item.status === 'published' ? 'green' : 'amber'"
                  />
                </td>
                <td class="text-xs text-gray-400 px-4 py-3 whitespace-nowrap">
                  {{ new Date(item.deletedAt!).toLocaleString('zh-CN') }}
                </td>
                <td class="px-4 py-3">
                  <div class="text-xs flex gap-1.5 items-center">
                    <button
                      class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="恢复"
                      type="button"
                      @click="restoreOne(item.id)"
                    >
                      <div class="i-carbon-restart" />
                      恢复
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyState
          v-else-if="trashOpen"
          description="回收站里没有内容，删除的新闻会在这里出现"
          icon="i-carbon-restart"
          title="回收站为空"
        />
      </Transition>
    </div>

    <div class="card overflow-hidden">
      <div v-if="pageItems.length" class="overflow-x-auto">
        <table class="text-sm text-left min-w-160 w-full">
          <thead>
            <tr class="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th class="px-4 py-3 w-10">
                <input
                  aria-label="全选当前页"
                  :checked="pageAllChecked"
                  class="accent-teal-600"
                  type="checkbox"
                  @change="togglePage"
                />
              </th>
              <th class="font-medium px-4 py-3">内容</th>
              <th class="font-medium px-4 py-3">分类</th>
              <th class="font-medium px-4 py-3">来源</th>
              <th class="font-medium px-4 py-3">阅读</th>
              <th class="font-medium px-4 py-3">状态</th>
              <th class="font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-gray-100 divide-y dark:divide-gray-800">
            <tr
              v-for="item in pageItems"
              :key="item.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              :class="selectedIds.has(item.id) ? 'bg-teal-500/5' : ''"
            >
              <td class="px-4 py-3">
                <input
                  :aria-label="`选择 ${item.title}`"
                  :checked="selectedIds.has(item.id)"
                  class="accent-teal-600"
                  type="checkbox"
                  @change="toggleOne(item.id)"
                />
              </td>
              <td class="px-4 py-3 max-w-lg">
                <RouterLink
                  class="font-medium line-clamp-1 hover:text-teal-600"
                  :title="item.title"
                  :to="`/news/${item.id}`"
                >
                  {{ item.title }}
                </RouterLink>
                <p class="text-xs text-gray-400 mt-0.5 flex gap-1.5 items-center">
                  <span v-if="item.pinned" class="text-orange-500 flex gap-0.5 items-center">
                    <div class="i-carbon-pin" />
                    置顶
                  </span>
                  <span v-if="item.tag" class="badge text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800">
                    {{ item.tag }}
                  </span>
                  <span>{{ item.time }}</span>
                </p>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="categoryOf(item.category)"
                  class="badge text-white"
                  :style="{
                    background: `linear-gradient(135deg, ${categoryOf(item.category)!.color[0]}, ${categoryOf(item.category)!.color[1]})`,
                  }"
                >
                  {{ categoryOf(item.category)!.label }}
                </span>
                <span v-else class="badge text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-800">
                  {{ item.category }}
                </span>
              </td>
              <td class="text-gray-500 px-4 py-3 dark:text-gray-400">{{ item.source }}</td>
              <td class="text-gray-500 px-4 py-3 dark:text-gray-400">{{ item.reads }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  :label="item.status === 'published' ? '已发布' : '草稿'"
                  :tone="item.status === 'published' ? 'green' : 'amber'"
                />
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-xs flex gap-1.5 items-center">
                  <RouterLink
                    class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    :to="`/news/${item.id}`"
                  >
                    <div class="i-carbon-edit" />
                    编辑
                  </RouterLink>
                  <button
                    class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    :title="item.pinned ? '取消置顶' : '设为置顶'"
                    type="button"
                    @click="togglePinned(item.id)"
                  >
                    <div class="i-carbon-pin-filled" />
                    {{ item.pinned ? '取消置顶' : '置顶' }}
                  </button>
                  <button
                    class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="复制为草稿"
                    type="button"
                    @click="cloneToDraft(item.id)"
                  >
                    <div class="i-carbon-copy" />
                    复制为草稿
                  </button>
                  <button
                    class="icon-btn text-red-500 px-2 py-1 rounded-md flex gap-1 items-center hover:bg-red-500/10"
                    type="button"
                    @click="pendingDeleteId = item.id"
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
      <EmptyState v-else description="试试调整筛选条件，或新建一条新闻" icon="i-carbon-document" title="没有匹配的新闻">
        <RouterLink class="btn" to="/news/new">
          <div class="i-carbon-add" />
          新建新闻
        </RouterLink>
      </EmptyState>
      <Pagination v-if="pageItems.length" v-model:page="page" :total="filteredTotal" :totalPages="totalPages" />
    </div>

    <ModalDialog
      cancelText="取消"
      confirmText="移入回收站"
      :open="Boolean(pendingDeleteId)"
      title="删除新闻"
      @cancel="pendingDeleteId = ''"
      @confirm="confirmDelete"
    >
      该新闻将被移入回收站，可在「回收站」中恢复。确定继续吗？
    </ModalDialog>

    <ModalDialog
      cancelText="取消"
      confirmText="删除"
      danger
      :open="pendingBulkDelete"
      title="批量删除新闻"
      @cancel="pendingBulkDelete = false"
      @confirm="confirmBulkDelete"
    >
      将已选的 {{ selectedCount }} 条新闻移入回收站，可在「回收站」中恢复。确定继续吗？
    </ModalDialog>

    <ModalDialog
      cancelText="取消"
      confirmText="清空"
      danger
      :open="pendingEmptyTrash"
      title="清空回收站"
      @cancel="pendingEmptyTrash = false"
      @confirm="confirmEmptyTrash"
    >
      回收站中的 {{ news.trashCount }} 条新闻将被永久删除，且无法恢复。确定继续吗？
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
