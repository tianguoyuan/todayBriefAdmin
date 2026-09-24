<script setup lang="ts">
  import { useToast } from '~/composables'
  import { APP_ADMIN_NAME, APP_NAME, APP_VERSION, STORAGE_PREFIX, STORAGE_SCHEMA_VERSION } from '~/utils/constants'

  usePageTitle('设置')

  const news = useNewsStore()
  const categories = useCategoryStore()
  const comments = useCommentStore()
  const users = useUserStore()

  const isDarkNow = computed(() => isDark)
  const importInput = ref<HTMLInputElement | null>(null)
  const importError = ref('')
  const resetConfirm = ref(false)
  const { show: showTip, tip } = useToast()

  const storageRows = computed(() =>
    [
      { count: news.list.value.length, key: `${STORAGE_PREFIX}news`, name: '新闻数据' },
      { count: categories.list.value.length, key: `${STORAGE_PREFIX}categories`, name: '分类数据' },
      { count: comments.list.value.length, key: `${STORAGE_PREFIX}comments`, name: '评论数据' },
      { count: users.list.value.length, key: `${STORAGE_PREFIX}users`, name: '用户数据' },
      { count: 1, key: `${STORAGE_PREFIX}sidebar-open`, name: '侧边栏状态' },
    ].map((row) => ({
      ...row,
      bytes: (localStorage.getItem(row.key)?.length ?? 0) * 2,
    })),
  )

  const infoRows = computed(() => [
    { label: '应用名称', value: APP_NAME },
    { label: '后台名称', value: APP_ADMIN_NAME },
    { label: '版本', value: APP_VERSION },
    { label: '存储前缀', value: STORAGE_PREFIX },
    { label: '数据格式版本', value: String(STORAGE_SCHEMA_VERSION) },
    { label: '开发地址', value: 'http://localhost:3334' },
  ])

  function exportData() {
    const payload = {
      app: APP_ADMIN_NAME,
      categories: categories.list.value,
      comments: comments.list.value,
      exportedAt: new Date().toISOString(),
      news: news.list.value,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      users: users.list.value,
      version: APP_VERSION,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `today-brief-admin-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    logAudit('export', '系统', '导出全量数据备份')
    showTip('已导出备份文件')
  }

  function isValidColorPair(value: unknown): value is [string, string] {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c))
    )
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object') {
        importError.value = '文件格式不正确：不是有效的备份对象'
        return
      }
      if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== STORAGE_SCHEMA_VERSION) {
        importError.value = `数据格式版本不匹配（文件 v${parsed.schemaVersion} / 当前 v${STORAGE_SCHEMA_VERSION}）`
        return
      }
      if (
        !Array.isArray(parsed.news) ||
        !Array.isArray(parsed.categories) ||
        !Array.isArray(parsed.comments) ||
        !Array.isArray(parsed.users)
      ) {
        importError.value = '文件格式不正确：缺少 news / categories / comments / users 数组'
        return
      }
      const isNews = (item: unknown) =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { title?: unknown }).title === 'string' &&
        typeof (item as { category?: unknown }).category === 'string' &&
        ((item as { status?: unknown }).status === 'published' || (item as { status?: unknown }).status === 'draft')
      const isCategory = (item: unknown) =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { label?: unknown }).label === 'string' &&
        isValidColorPair((item as { color?: unknown }).color)
      const isComment = (item: unknown) =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { newsId?: unknown }).newsId === 'string' &&
        typeof (item as { content?: unknown }).content === 'string'
      const isUser = (item: unknown) =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { username?: unknown }).username === 'string'
      if (
        !parsed.news.every(isNews) ||
        !parsed.categories.every(isCategory) ||
        !parsed.comments.every(isComment) ||
        !parsed.users.every(isUser)
      ) {
        importError.value = '文件格式不正确：存在字段缺失或类型不符的数据条目'
        return
      }
      news.list.value = parsed.news
      categories.list.value = parsed.categories
      comments.list.value = parsed.comments
      users.list.value = parsed.users
      importError.value = ''
      logAudit('create', '系统', '导入数据备份')
      showTip('导入成功')
    }
 catch {
      importError.value = '文件解析失败，请确认是有效的数据备份文件'
    }
  }

  function onImportChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file)
      importData(file).finally(() => {
        input.value = ''
      })
  }

  function resetAll() {
    news.resetNews()
    categories.resetCategories()
    comments.resetComments()
    users.resetUsers()
    logAudit('other', '系统', '重置全部演示数据')
    resetConfirm.value = false
    showTip('已重置全部数据')
  }

  function resetSection(name: string, fn: () => void) {
    fn()
    showTip(`已重置${name}`)
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold">设置</h2>
      <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">管理后台界面偏好与本地演示数据。</p>
    </div>

    <section class="p-5 card">
      <h3 class="text-base font-bold mb-4">基本信息</h3>
      <dl class="gap-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="row in infoRows" :key="row.label" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60">
          <dt class="text-xs text-gray-400">{{ row.label }}</dt>
          <dd class="text-sm font-mono mt-1 truncate">{{ row.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="p-5 card flex flex-wrap gap-4 items-center justify-between">
      <div>
        <h3 class="text-base font-bold">深色模式</h3>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">切换后台的明暗主题，偏好将保存在本地。</p>
      </div>
      <button class="btn-ghost" type="button" @click="() => toggleDark()">
        <div :class="isDarkNow ? 'i-carbon-sun' : 'i-carbon-moon'" />
        {{ isDarkNow ? '当前：深色' : '当前：浅色' }}
      </button>
    </section>

    <section class="p-5 card space-y-4">
      <div>
        <h3 class="text-base font-bold">数据管理</h3>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">
          演示后台的全部数据都保存在浏览器本地（localStorage），可整体导出、导入或按模块重置。
        </p>
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <button class="btn-ghost" type="button" @click="exportData">
          <div class="i-carbon-download" />
          导出备份
        </button>
        <button class="btn-ghost" type="button" @click="importInput?.click()">
          <div class="i-carbon-upload" />
          导入备份
        </button>
        <input ref="importInput" accept="application/json,.json" class="hidden" type="file" @change="onImportChange" />
        <span v-if="importError" class="text-xs text-red-500">{{ importError }}</span>
      </div>

      <div>
        <h4 class="text-sm text-gray-600 font-medium mb-2 dark:text-gray-300">按模块重置</h4>
        <div class="flex flex-wrap gap-2">
          <button class="btn-ghost text-xs" type="button" @click="resetSection('新闻数据', news.resetNews)">
            重置新闻
          </button>
          <button class="btn-ghost text-xs" type="button" @click="resetSection('分类数据', categories.resetCategories)">
            重置分类
          </button>
          <button class="btn-ghost text-xs" type="button" @click="resetSection('评论数据', comments.resetComments)">
            重置评论
          </button>
          <button class="btn-ghost text-xs" type="button" @click="resetSection('用户数据', users.resetUsers)">
            重置用户
          </button>
        </div>
      </div>

      <div class="p-4 border border-red-200/70 rounded-lg bg-red-500/5 dark:border-red-900/40">
        <p class="text-red-600 font-medium">危险操作</p>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">
          重置全部模块会将新闻、分类、评论、用户恢复为演示初始数据，当前所有修改将丢失。
        </p>
        <button class="btn-danger mt-3" type="button" @click="resetConfirm = true">重置全部数据</button>
      </div>
    </section>

    <section class="p-5 card">
      <h3 class="text-base font-bold mb-4">本地存储明细</h3>
      <div class="overflow-x-auto">
        <table class="text-sm text-left min-w-120 w-full">
          <thead>
            <tr class="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th class="font-medium px-4 py-2.5">名称</th>
              <th class="font-medium px-4 py-2.5">键</th>
              <th class="font-medium px-4 py-2.5">条数</th>
              <th class="font-medium px-4 py-2.5">大小</th>
            </tr>
          </thead>
          <tbody class="divide-gray-100 divide-y dark:divide-gray-800">
            <tr v-for="row in storageRows" :key="row.key">
              <td class="font-medium px-4 py-2.5">{{ row.name }}</td>
              <td class="text-xs text-gray-400 font-mono px-4 py-2.5">{{ row.key }}</td>
              <td class="px-4 py-2.5">{{ row.count }}</td>
              <td class="text-xs text-gray-400 font-mono px-4 py-2.5">{{ row.bytes.toLocaleString() }} B</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ModalDialog
      cancelText="取消"
      confirmText="确认重置"
      danger
      :open="resetConfirm"
      title="重置全部数据"
      @cancel="resetConfirm = false"
      @confirm="resetAll"
    >
      此操作不可撤销，将删除你在后台做出的所有修改并恢复演示初始数据。确定继续吗？
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
