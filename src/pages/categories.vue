<script setup lang="ts">
  import type { CategoryDraft, CategoryRecord } from '~/composables/categoryStore'
  import { exportXlsx } from '~/utils/exportXlsx'
  import { avatarPalettes } from '~/utils/palettes'

  usePageTitle('分类管理')

  const categories = useCategoryStore()
  const news = useNewsStore()

  const modalOpen = ref(false)
  const isEdit = ref(false)
  const editingId = ref('')
  const editingLocked = ref(false)
  const draft = reactive<CategoryDraft>({ color: avatarPalettes[0], label: '' })
  const error = ref('')
  const pendingDeleteId = ref('')

  const newsCountByCategory = computed(() => {
    const map = new Map<string, number>()
    news.list.value.forEach((item) => map.set(item.category, (map.get(item.category) ?? 0) + 1))
    return map
  })

  const ordered = computed(() => {
    const locked = categories.list.value.filter((c) => c.locked)
    const rest = categories.list.value.filter((c) => !c.locked)
    return [...locked, ...rest]
  })

  function openCreate() {
    isEdit.value = false
    editingId.value = ''
    editingLocked.value = false
    draft.label = ''
    draft.color = avatarPalettes[0]
    error.value = ''
    modalOpen.value = true
  }

  function openEdit(category: CategoryRecord) {
    isEdit.value = true
    editingId.value = category.id
    editingLocked.value = category.locked
    draft.label = category.label
    draft.color = category.color
    error.value = ''
    modalOpen.value = true
  }

  function save() {
    const label = draft.label.trim()
    if (!label) {
      error.value = '请输入分类名称'
      return
    }
    if (isEdit.value) {
      categories.updateCategory(editingId.value, { color: draft.color, label })
      logAudit('update', '分类', `更新分类「${label}」`)
    }
 else {
      categories.createCategory({ color: draft.color, label })
      logAudit('create', '分类', `新建分类「${label}」`)
    }
    modalOpen.value = false
  }

  function confirmDelete() {
    if (pendingDeleteId.value) {
      categories.removeCategory(pendingDeleteId.value)
      logAudit('delete', '分类', '删除一个分类')
    }
    pendingDeleteId.value = ''
  }

  function exportAll() {
    const rows = ordered.value.map((category) => [
      category.label,
      category.id,
      category.locked ? (category.id === 'all' ? '推荐' : '默认') : '',
      newsCountByCategory.value.get(category.id) ?? 0,
      category.color[0],
      category.color[1],
    ])
    exportXlsx(
      `分类列表-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['名称', '标识', '锁定', '新闻数', '起始色', '结束色'],
      rows,
      '分类列表',
    )
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">分类管理</h2>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">
          共 {{ categories.total }} 个分类，关联 {{ news.total }} 条新闻。
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <button class="btn-ghost" type="button" @click="exportAll">
          <div class="i-carbon-download" />
          导出
        </button>
        <button class="btn" type="button" @click="openCreate">
          <div class="i-carbon-add" />
          新增分类
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div v-if="ordered.length" class="overflow-x-auto">
        <table class="text-sm text-left min-w-140 w-full">
          <thead>
            <tr class="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th class="font-medium px-4 py-3">分类</th>
              <th class="font-medium px-4 py-3">标识</th>
              <th class="font-medium px-4 py-3">配色</th>
              <th class="font-medium px-4 py-3">新闻数</th>
              <th class="font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-gray-100 divide-y dark:divide-gray-800">
            <tr
              v-for="category in ordered"
              :key="category.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              <td class="px-4 py-3">
                <span class="font-medium flex gap-2 items-center">
                  <span
                    class="rounded-full h-3 w-3"
                    :style="{ background: `linear-gradient(135deg, ${category.color[0]}, ${category.color[1]})` }"
                  />
                  {{ category.label }}
                  <span
                    v-if="category.locked"
                    class="badge text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800"
                  >
                    {{ category.id === 'all' ? '推荐' : '默认' }}
                  </span>
                </span>
              </td>
              <td class="text-xs text-gray-400 font-mono px-4 py-3">{{ category.id }}</td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-400 font-mono">{{ category.color[0] }} → {{ category.color[1] }}</span>
              </td>
              <td class="text-gray-500 px-4 py-3 dark:text-gray-400">
                {{ newsCountByCategory.get(category.id) ?? 0 }}
              </td>
              <td class="px-4 py-3">
                <div class="text-xs flex gap-1.5 items-center">
                  <button
                    class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    type="button"
                    @click="openEdit(category)"
                  >
                    <div class="i-carbon-edit" />
                    编辑
                  </button>
                  <button
                    class="icon-btn text-red-500 px-2 py-1 rounded-md flex gap-1 items-center hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="category.locked || (newsCountByCategory.get(category.id) ?? 0) > 0"
                    :title="
                      category.locked
                        ? '默认分类不可删除'
                        : (newsCountByCategory.get(category.id) ?? 0) > 0
                          ? '该分类下仍有新闻，无法删除'
                          : '删除该分类'
                    "
                    type="button"
                    @click="pendingDeleteId = category.id"
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
      <EmptyState v-else description="点击右上角新增分类。" icon="i-carbon-categories" title="暂无分类" />
    </div>

    <ModalDialog
      cancelText="取消"
      confirmText="删除"
      danger
      :open="Boolean(pendingDeleteId)"
      title="删除分类"
      @cancel="pendingDeleteId = ''"
      @confirm="confirmDelete"
    >
      删除后该项分类将从列表中移除，且无法恢复。确定继续吗？
    </ModalDialog>

    <ModalDialog
      cancelText="取消"
      confirmText="保存"
      :open="modalOpen"
      :title="isEdit ? '编辑分类' : '新增分类'"
      @cancel="modalOpen = false"
      @confirm="save"
    >
      <div class="space-y-4">
        <div>
          <label class="label" for="category-name">分类名称</label>
          <input
            id="category-name"
            v-model="draft.label"
            class="input"
            maxlength="12"
            placeholder="例如：生活"
            type="text"
          />
          <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
        </div>
        <div v-if="isEdit">
          <span class="label">标识（不可修改）</span>
          <p
            class="text-xs text-gray-500 font-mono px-3 py-2 rounded-lg bg-gray-100 dark:text-gray-400 dark:bg-gray-800"
          >
            {{ editingId }}
          </p>
        </div>
        <div>
          <span class="label">配色</span>
          <GradientPicker v-model="draft.color" />
        </div>
      </div>
    </ModalDialog>
  </div>
</template>
