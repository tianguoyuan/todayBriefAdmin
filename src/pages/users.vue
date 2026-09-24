<script setup lang="ts">
  import type { UserDraft, UserRecord, UserRole, UserStatus } from '~/composables/userStore'
  import { useDebouncedSearch, useToast } from '~/composables'
  import { usePagination } from '~/composables/usePagination'
  import { exportXlsx } from '~/utils/exportXlsx'
  import { avatarPalettes } from '~/utils/palettes'
  import { normalizeQueryParam } from '~/utils/params'

  usePageTitle('用户管理')

  const route = useRoute()
  const router = useRouter()
  const users = useUserStore()

  const { debounced: keywordDebounced, input: keyword } = useDebouncedSearch(
    typeof route.query.kw === 'string' ? route.query.kw : '',
  )
  const roleFilter = ref(
    normalizeQueryParam<'all' | UserRole>(route.query.role, ['all', 'admin', 'editor', 'user'], 'all'),
  )
  const statusFilter = ref(
    normalizeQueryParam<'all' | UserStatus>(route.query.status, ['all', 'active', 'banned'], 'all'),
  )

  const pendingDeleteId = ref('')
  const pendingBulkDelete = ref(false)
  const selectedIds = ref<Set<string>>(new Set())
  const { show: showTip, tip } = useToast()

  const modalOpen = ref(false)
  const isEdit = ref(false)
  const editingId = ref('')
  const draft = reactive<UserDraft>({
    avatar: avatarPalettes[0],
    bio: '',
    followers: 0,
    following: 0,
    likes: 0,
    posts: 0,
    role: 'user',
    status: 'active',
    username: '',
  })
  const error = ref('')

  const filtered = computed(() => {
    const kw = keywordDebounced.value.trim().toLowerCase()
    return users.list.value.filter((user) => {
      if (statusFilter.value !== 'all' && user.status !== statusFilter.value) return false
      if (roleFilter.value !== 'all' && user.role !== roleFilter.value) return false
      if (kw && ![user.username, user.bio].some((s) => s.toLowerCase().includes(kw))) return false
      return true
    })
  })

  const { page, pageItems, total: filteredTotal, totalPages } = usePagination(filtered, 10)

  watch([keywordDebounced, roleFilter, statusFilter], () => {
    selectedIds.value = new Set()
    syncToUrl()
  })

  function syncToUrl() {
    router.replace({
      query: {
        ...route.query,
        kw: keywordDebounced.value || undefined,
        role: roleFilter.value === 'all' ? undefined : roleFilter.value,
        status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      },
    })
  }

  const roleMeta: Record<UserRole, { label: string; cls: string }> = {
    admin: { cls: 'bg-red-500/10 text-red-600 dark:text-red-400', label: '管理员' },
    editor: { cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', label: '编辑' },
    user: { cls: 'bg-gray-500/10 text-gray-500 dark:text-gray-400', label: '用户' },
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

  function bulkSetStatus(status: UserStatus) {
    users.bulkSetUserStatus(selectedIds.value, status)
    logAudit('update', '用户', `批量${status === 'banned' ? '禁用' : '解禁'} ${selectedCount.value} 位用户`)
    clearSelection()
  }

  function confirmBulkDelete() {
    const count = selectedCount.value
    users.bulkRemoveUsers(selectedIds.value)
    logAudit('delete', '用户', `批量删除 ${count} 位用户`)
    pendingBulkDelete.value = false
    clearSelection()
  }

  function openCreate() {
    isEdit.value = false
    editingId.value = ''
    draft.username = ''
    draft.avatar = avatarPalettes[Math.floor(Math.random() * avatarPalettes.length)]
    draft.bio = ''
    draft.followers = 0
    draft.following = 0
    draft.posts = 0
    draft.likes = 0
    draft.role = 'user'
    draft.status = 'active'
    error.value = ''
    modalOpen.value = true
  }

  function openEdit(user: UserRecord) {
    isEdit.value = true
    editingId.value = user.id
    draft.username = user.username
    draft.avatar = user.avatar
    draft.bio = user.bio
    draft.followers = user.followers
    draft.following = user.following
    draft.posts = user.posts
    draft.likes = user.likes
    draft.role = user.role
    draft.status = user.status
    error.value = ''
    modalOpen.value = true
  }

  function save() {
    const username = draft.username.trim()
    if (!username) {
      error.value = '请输入用户名'
      return
    }
    if (isEdit.value) {
      users.updateUser(editingId.value, { ...draft, username })
      logAudit('update', '用户', `更新用户「${username}」`)
    }
 else {
      users.createUser({ ...draft, username })
      logAudit('create', '用户', `新建用户「${username}」`)
    }
    modalOpen.value = false
  }

  function confirmDelete() {
    if (pendingDeleteId.value) {
      users.removeUser(pendingDeleteId.value)
      logAudit('delete', '用户', '删除一位用户')
    }
    pendingDeleteId.value = ''
  }

  function exportFiltered() {
    const roleLabel = (role: UserRole) => (role === 'admin' ? '管理员' : role === 'editor' ? '编辑' : '用户')
    const rows = filtered.value.map((user) => [
      user.username,
      roleLabel(user.role),
      user.status === 'active' ? '正常' : '已禁用',
      user.bio,
      user.followers,
      user.following,
      user.posts,
      user.likes,
      user.joinedAt,
    ])
    exportXlsx(
      `用户列表-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['用户名', '角色', '状态', '简介', '粉丝', '关注', '动态', '获赞', '加入时间'],
      rows,
      '用户列表',
    )
    showTip('已导出当前筛选结果')
  }
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">用户管理</h2>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">
          共 {{ users.total }} 位用户 · 活跃 {{ users.activeCount }} · 禁用 {{ users.bannedCount }} · 累计粉丝
          {{ users.totalFollowers }}
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <button class="btn-ghost" type="button" @click="exportFiltered">
          <div class="i-carbon-download" />
          导出
        </button>
        <button class="btn" type="button" @click="openCreate">
          <div class="i-carbon-add" />
          新增用户
        </button>
      </div>
    </div>

    <div class="p-4 card flex flex-wrap gap-3 items-center">
      <div class="flex-1 min-w-52 relative">
        <div class="text-gray-400 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2">
          <div class="i-carbon-search" />
        </div>
        <input v-model="keyword" class="input pl-9" placeholder="搜索用户名或简介" type="text" />
      </div>
      <select v-model="roleFilter" class="input min-w-32 w-auto">
        <option value="all">全部角色</option>
        <option value="admin">管理员</option>
        <option value="editor">编辑</option>
        <option value="user">用户</option>
      </select>
      <select v-model="statusFilter" class="input min-w-32 w-auto">
        <option value="all">全部状态</option>
        <option value="active">正常</option>
        <option value="banned">已禁用</option>
      </select>
      <span class="text-xs text-gray-400">筛选出 {{ filteredTotal }} 位</span>
    </div>

    <Transition name="page">
      <div v-if="selectedCount > 0" class="p-4 card border-teal-500/30 flex flex-wrap gap-3 items-center">
        <span class="text-sm text-teal-600 font-medium dark:text-teal-400">已选择 {{ selectedCount }} 位</span>
        <div class="flex flex-wrap gap-2">
          <button class="btn text-xs" type="button" @click="bulkSetStatus('active')">
            <div class="i-carbon-user-online" />
            批量解禁
          </button>
          <button class="btn-ghost text-xs" type="button" @click="bulkSetStatus('banned')">
            <div class="i-carbon-user-minus" />
            批量禁用
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
        <table class="text-sm text-left min-w-160 w-full">
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
              <th class="font-medium px-4 py-3">角色</th>
              <th class="font-medium px-4 py-3">粉丝 / 关注</th>
              <th class="font-medium px-4 py-3">发布 / 获赞</th>
              <th class="font-medium px-4 py-3">状态</th>
              <th class="font-medium px-4 py-3">加入时间</th>
              <th class="font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-gray-100 divide-y dark:divide-gray-800">
            <tr
              v-for="user in pageItems"
              :key="user.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              :class="user.status === 'banned' ? 'opacity-60' : ''"
            >
              <td class="px-4 py-3">
                <input
                  :aria-label="`选择 ${user.username}`"
                  :checked="selectedIds.has(user.id)"
                  class="accent-teal-600"
                  type="checkbox"
                  @change="toggleOne(user.id)"
                />
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2.5 items-center">
                  <div
                    class="text-xs text-white font-bold rounded-full shrink-0 grid h-9 w-9 place-items-center"
                    :style="{ background: `linear-gradient(135deg, ${user.avatar[0]}, ${user.avatar[1]})` }"
                  >
                    {{ user.username.slice(0, 1) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium truncate">{{ user.username }}</p>
                    <p class="text-xs text-gray-400 max-w-48 truncate">{{ user.bio }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="badge" :class="roleMeta[user.role].cls">{{ roleMeta[user.role].label }}</span>
              </td>
              <td class="text-gray-500 px-4 py-3 whitespace-nowrap dark:text-gray-400">
                {{ user.followers }} / {{ user.following }}
              </td>
              <td class="text-gray-500 px-4 py-3 whitespace-nowrap dark:text-gray-400">
                {{ user.posts }} / {{ user.likes }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="badge"
                  :class="
                    user.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-500'
                  "
                >
                  {{ user.status === 'active' ? '正常' : '已禁用' }}
                </span>
              </td>
              <td class="text-xs text-gray-400 px-4 py-3 whitespace-nowrap">{{ user.joinedAt }}</td>
              <td class="px-4 py-3">
                <div class="text-xs flex gap-1.5 items-center">
                  <button
                    class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    type="button"
                    @click="openEdit(user)"
                  >
                    <div class="i-carbon-edit" />
                    编辑
                  </button>
                  <button
                    class="icon-btn px-2 py-1 rounded-md flex gap-1 items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    type="button"
                    @click="users.toggleUserStatus(user.id)"
                  >
                    <div :class="user.status === 'active' ? 'i-carbon-user-minus' : 'i-carbon-user-online'" />
                    {{ user.status === 'active' ? '禁用' : '解禁' }}
                  </button>
                  <button
                    class="icon-btn text-red-500 px-2 py-1 rounded-md flex gap-1 items-center hover:bg-red-500/10"
                    type="button"
                    @click="pendingDeleteId = user.id"
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
      <EmptyState
        v-else
        description="试试调整筛选条件，或新增用户。"
        icon="i-carbon-user-multiple"
        title="没有匹配的用户"
      />
      <Pagination v-if="pageItems.length" v-model:page="page" :total="filteredTotal" :totalPages="totalPages" />
    </div>

    <ModalDialog
      cancelText="取消"
      confirmText="删除"
      danger
      :open="Boolean(pendingDeleteId)"
      title="删除用户"
      @cancel="pendingDeleteId = ''"
      @confirm="confirmDelete"
    >
      删除后该用户的账号信息将无法恢复。确定继续吗？
    </ModalDialog>

    <ModalDialog
      cancelText="取消"
      confirmText="删除"
      danger
      :open="pendingBulkDelete"
      title="批量删除用户"
      @cancel="pendingBulkDelete = false"
      @confirm="confirmBulkDelete"
    >
      将删除已选的 {{ selectedCount }} 位用户，且无法恢复。确定继续吗？
    </ModalDialog>

    <ModalDialog
      cancelText="取消"
      confirmText="保存"
      :open="modalOpen"
      :title="isEdit ? '编辑用户' : '新增用户'"
      @cancel="modalOpen = false"
      @confirm="save"
    >
      <div class="space-y-4">
        <div>
          <label class="label" for="user-name">用户名</label>
          <input
            id="user-name"
            v-model="draft.username"
            class="input"
            maxlength="20"
            placeholder="请输入用户名"
            type="text"
          />
          <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
        </div>
        <div>
          <label class="label" for="user-bio">简介</label>
          <input id="user-bio" v-model="draft.bio" class="input" maxlength="40" placeholder="一句话简介" type="text" />
        </div>
        <div class="gap-4 grid grid-cols-2">
          <div>
            <label class="label" for="user-followers">粉丝数</label>
            <input id="user-followers" v-model.number="draft.followers" class="input" min="0" type="number" />
          </div>
          <div>
            <label class="label" for="user-following">关注数</label>
            <input id="user-following" v-model.number="draft.following" class="input" min="0" type="number" />
          </div>
          <div>
            <label class="label" for="user-posts">发布量</label>
            <input id="user-posts" v-model.number="draft.posts" class="input" min="0" type="number" />
          </div>
          <div>
            <label class="label" for="user-likes">获赞数</label>
            <input id="user-likes" v-model.number="draft.likes" class="input" min="0" type="number" />
          </div>
        </div>
        <div class="gap-4 grid grid-cols-2">
          <div>
            <label class="label" for="user-role">角色</label>
            <select id="user-role" v-model="draft.role" class="input">
              <option value="user">用户</option>
              <option value="editor">编辑</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div>
            <span class="label">状态</span>
            <div class="pt-1 flex gap-4">
              <label class="text-sm flex gap-1.5 cursor-pointer items-center">
                <input v-model="draft.status" class="accent-teal-600" type="radio" value="active" />
                正常
              </label>
              <label class="text-sm flex gap-1.5 cursor-pointer items-center">
                <input v-model="draft.status" class="accent-red-500" type="radio" value="banned" />
                禁用
              </label>
            </div>
          </div>
        </div>
      </div>
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
