<script setup lang="ts">
  import type { AuditAction } from '~/composables/auditStore'
  import { useDebouncedSearch, useToast } from '~/composables'
  import { usePagination } from '~/composables/usePagination'
  import { exportXlsx } from '~/utils/exportXlsx'
  import { normalizeQueryParam } from '~/utils/params'

  usePageTitle('操作日志')

  const route = useRoute()
  const router = useRouter()
  const audit = useAuditStore()

  const { debounced: keywordDebounced, input: keyword } = useDebouncedSearch(
    typeof route.query.kw === 'string' ? route.query.kw : '',
  )
  const moduleFilter = ref(
    normalizeQueryParam<string>(route.query.module, ['all', '新闻', '评论', '用户', '分类', '系统'], 'all'),
  )
  const actionFilter = ref(
    normalizeQueryParam<'all' | AuditAction>(
      route.query.action,
      ['all', 'create', 'update', 'delete', 'restore', 'publish', 'export'],
      'all',
    ),
  )

  const { show: showTip, tip } = useToast()

  const actionLabels: Record<AuditAction, string> = {
    create: '新建',
    delete: '删除',
    export: '导出',
    other: '其他',
    publish: '发布',
    restore: '恢复',
    update: '更新',
  }

  const actionTones: Record<AuditAction, string> = {
    create: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    delete: 'bg-red-500/10 text-red-600 dark:text-red-400',
    export: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    other: 'bg-gray-200/70 text-gray-500 dark:text-gray-400',
    publish: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    restore: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    update: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  }

  const filtered = computed(() => {
    const kw = keywordDebounced.value.trim().toLowerCase()
    return audit.list.value.filter((record) => {
      if (moduleFilter.value !== 'all' && record.module !== moduleFilter.value) return false
      if (actionFilter.value !== 'all' && record.action !== actionFilter.value) return false
      if (kw && ![record.detail, record.actor].some((s) => s.toLowerCase().includes(kw))) return false
      return true
    })
  })

  const { page, pageItems, total: filteredTotal, totalPages } = usePagination(filtered, 15)

  watch([keywordDebounced, moduleFilter, actionFilter], () => {
    syncToUrl()
  })

  function syncToUrl() {
    router.replace({
      query: {
        ...route.query,
        action: actionFilter.value === 'all' ? undefined : actionFilter.value,
        kw: keywordDebounced.value || undefined,
        module: moduleFilter.value === 'all' ? undefined : moduleFilter.value,
      },
    })
  }

  function exportFiltered() {
    const rows = filtered.value.map((record) => [
      new Date(record.at).toLocaleString('zh-CN'),
      record.module,
      actionLabels[record.action],
      record.detail,
      record.actor,
    ])
    exportXlsx(
      `操作日志-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['时间', '模块', '操作', '详情', '操作人'],
      rows,
      '操作日志',
    )
    showTip('已导出当前筛选结果')
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">操作日志</h2>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">共 {{ audit.total }} 条记录 · 最多保留最近 200 条</p>
      </div>
    </div>

    <div class="p-4 card flex flex-wrap gap-3 items-center">
      <div class="flex-1 min-w-52 relative">
        <div class="text-gray-400 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2">
          <div class="i-carbon-search" />
        </div>
        <input v-model="keyword" class="input pl-9" placeholder="搜索详情或操作人" type="text" />
      </div>
      <select v-model="moduleFilter" class="input min-w-32 w-auto">
        <option value="all">全部模块</option>
        <option value="新闻">新闻</option>
        <option value="评论">评论</option>
        <option value="用户">用户</option>
        <option value="分类">分类</option>
        <option value="系统">系统</option>
      </select>
      <select v-model="actionFilter" class="input min-w-32 w-auto">
        <option value="all">全部操作</option>
        <option v-for="(label, action) in actionLabels" :key="action" :value="action">
          {{ label }}
        </option>
      </select>
      <span class="text-xs text-gray-400">筛选出 {{ filteredTotal }} 条</span>
      <button class="btn-ghost text-xs" type="button" @click="exportFiltered">
        <div class="i-carbon-download" />
        导出当前结果
      </button>
    </div>

    <div class="card overflow-hidden">
      <div v-if="pageItems.length" class="overflow-x-auto">
        <table class="text-sm text-left min-w-160 w-full">
          <thead>
            <tr class="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th class="font-medium px-4 py-3">时间</th>
              <th class="font-medium px-4 py-3">模块</th>
              <th class="font-medium px-4 py-3">操作</th>
              <th class="font-medium px-4 py-3">详情</th>
              <th class="font-medium px-4 py-3">操作人</th>
            </tr>
          </thead>
          <tbody class="divide-gray-100 divide-y dark:divide-gray-800">
            <tr
              v-for="record in pageItems"
              :key="record.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              <td class="text-xs text-gray-400 px-4 py-3 whitespace-nowrap">
                {{ new Date(record.at).toLocaleString('zh-CN') }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="badge text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800">
                  {{ record.module }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="badge" :class="actionTones[record.action]">
                  {{ actionLabels[record.action] }}
                </span>
              </td>
              <td class="text-gray-600 px-4 py-3 max-w-md dark:text-gray-300">{{ record.detail }}</td>
              <td class="text-gray-400 px-4 py-3 whitespace-nowrap">{{ record.actor }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else description="暂时没有操作记录。" icon="i-carbon-list-boxes" title="没有日志" />
      <Pagination v-if="pageItems.length" v-model:page="page" :total="filteredTotal" :totalPages="totalPages" />
    </div>

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
