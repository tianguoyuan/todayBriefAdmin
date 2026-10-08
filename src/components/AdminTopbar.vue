<script setup lang="ts">
  import { fontSize } from '~/composables'
  import { APP_NAME, APP_VERSION } from '~/utils/constants'

  const isMobile = useMediaQuery('(max-width: 1023px)')

  const profileMenuOpen = ref(false)
  const fontSizeMenuOpen = ref(false)
  const profileModalOpen = ref(false)
  const logoutConfirmOpen = ref(false)
  const profileRef = ref<HTMLElement | null>(null)
  const fontSizeRef = ref<HTMLElement | null>(null)
  const comments = useCommentStore()
  const auth = useAuthStore()

  const unreadComments = computed(() => comments.unreadCount.value)

  const admin = computed(
    () =>
      auth.user.value ?? {
        avatar: '管',
        email: 'admin@todaybrief',
        joinedAt: '2024-01-04',
        role: '超级管理员',
        username: '管理员',
      },
  )

  onClickOutside(profileRef, () => {
    profileMenuOpen.value = false
  })

  onClickOutside(fontSizeRef, () => {
    fontSizeMenuOpen.value = false
  })

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      profileMenuOpen.value = false
      fontSizeMenuOpen.value = false
      logoutConfirmOpen.value = false
    }
  }

  function setFontSize(size: 'sm' | 'md' | 'lg') {
    fontSize.value = size
    fontSizeMenuOpen.value = false
  }

  function toggleFontSizeMenu() {
    fontSizeMenuOpen.value = !fontSizeMenuOpen.value
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  function toggleMenu() {
    profileMenuOpen.value = !profileMenuOpen.value
  }

  function openProfile() {
    profileMenuOpen.value = false
    profileModalOpen.value = true
  }

  function requestLogout() {
    profileMenuOpen.value = false
    logoutConfirmOpen.value = true
  }

  function confirmLogout() {
    auth.logout()
    window.location.href = '/'
  }
</script>

<template>
  <header
    class="px-4 border-b border-gray-200/70 bg-white/90 flex shrink-0 gap-3 h-14 items-center top-0 sticky z-30 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/90"
  >
    <button v-if="isMobile" class="icon-btn text-xl" title="打开菜单" type="button" @click="toggleAdminSidebar()">
      <div class="i-carbon-menu" />
    </button>
    <h1 class="text-base font-bold truncate">{{ pageTitle }}</h1>
    <div class="flex-1" />
    <span class="text-xs text-gray-400 hidden md:inline">{{ APP_NAME }} · {{ APP_VERSION }} · 演示后台</span>
    <div ref="fontSizeRef" class="flex items-center justify-center relative" title="调整字体大小">
      <button
        class="icon-btn text-xl cursor-pointer"
        :title="fontSize === 'md' ? '调整字体大小' : '恢复默认字体'"
        type="button"
        @click="toggleFontSizeMenu"
      >
        <div class="i-carbon-text-scale" />
      </button>
      <Transition name="menu">
        <div
          v-if="fontSizeMenuOpen"
          class="mt-2 py-1 border border-gray-100 rounded-xl bg-white w-36 shadow-lg right-0 top-full absolute z-40 overflow-hidden dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="text-xs text-gray-500 px-3 py-2 dark:text-gray-400">
            当前: {{ { sm: '小 (14px)', md: '标准 (16px)', lg: '大 (18px)' }[fontSize] }}
          </div>
          <div class="border-t border-gray-100 dark:border-gray-700" />
          <button
            class="text-sm text-gray-700 px-3 py-2 flex gap-2 w-full transition-colors items-center justify-between dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            type="button"
            @click="setFontSize('sm')"
          >
            <div class="i-carbon-arrow-down" />
            小 (14px)
          </button>
          <button
            class="text-sm text-gray-700 px-3 py-2 flex gap-2 w-full transition-colors items-center justify-between dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            type="button"
            @click="setFontSize('md')"
          >
            <div class="i-carbon-minus" />
            标准 (16px)
          </button>
          <button
            class="text-sm text-gray-700 px-3 py-2 flex gap-2 w-full transition-colors items-center justify-between dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            type="button"
            @click="setFontSize('lg')"
          >
            <div class="i-carbon-arrow-up" />
            大 (18px)
          </button>
        </div>
      </Transition>
    </div>
    <button class="icon-btn text-xl cursor-pointer" title="切换主题" type="button" @click="() => toggleDark()">
      <div class="i-carbon-moon dark:i-carbon-sun" />
    </button>
    <RouterLink class="icon-btn text-xl relative" title="评论管理" to="/comments">
      <div class="i-carbon-chat" />
      <span
        v-if="unreadComments > 0"
        class="text-[9px] text-white leading-none rounded-full bg-amber-500 grid h-4 w-4 place-items-center absolute -right-0.5 -top-0.5"
      >
        {{ unreadComments > 99 ? '99+' : unreadComments }}
      </span>
    </RouterLink>
    <div ref="profileRef" class="relative">
      <button
        :aria-expanded="profileMenuOpen"
        aria-haspopup="menu"
        class="text-left rounded-lg flex gap-2 cursor-pointer transition-opacity items-center hover:opacity-80"
        title="账户菜单"
        type="button"
        @click="toggleMenu"
      >
        <div
          class="text-xs text-white font-bold rounded-full grid h-8 w-8 place-items-center from-teal-500 to-sky-500 bg-gradient-to-br"
        >
          {{ admin.avatar }}
        </div>
        <div class="leading-tight hidden sm:block">
          <p class="text-xs font-medium">{{ admin.username }}</p>
          <p class="text-[10px] text-gray-400">{{ admin.email }}</p>
        </div>
      </button>

      <Transition name="menu">
        <div
          v-if="profileMenuOpen"
          class="mt-2 py-1 border border-gray-100 rounded-xl bg-white w-44 shadow-lg right-0 top-full absolute z-40 overflow-hidden dark:border-gray-700 dark:bg-gray-800"
          role="menu"
        >
          <button
            class="text-sm text-gray-700 px-4 py-2 flex gap-2 w-full transition-colors items-center dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            role="menuitem"
            type="button"
            @click="openProfile"
          >
            <div class="i-carbon-user-avatar" />
            个人信息
          </button>
          <div class="border-t border-gray-100 dark:border-gray-700" />
          <button
            class="text-sm text-red-500 px-4 py-2 flex gap-2 w-full transition-colors items-center hover:bg-red-500/10"
            role="menuitem"
            type="button"
            @click="requestLogout"
          >
            <div class="i-carbon-logout" />
            退出登录
          </button>
        </div>
      </Transition>
    </div>

    <ModalDialog
      cancelText="关闭"
      confirmText="知道了"
      :open="profileModalOpen"
      title="个人信息"
      @cancel="profileModalOpen = false"
      @confirm="profileModalOpen = false"
    >
      <div class="flex gap-4 items-center">
        <div
          class="text-xl text-white font-bold rounded-full shrink-0 grid h-14 w-14 place-items-center from-teal-500 to-sky-500 bg-gradient-to-br"
        >
          {{ admin.avatar }}
        </div>
        <div>
          <p class="text-base font-bold">{{ admin.username }}</p>
          <p class="text-xs text-gray-400">{{ admin.email }}</p>
        </div>
      </div>
      <dl class="text-sm mt-4 gap-2 grid grid-cols-2">
        <dt class="text-xs text-gray-400">角色</dt>
        <dd class="text-right">{{ admin.role }}</dd>
        <dt class="text-xs text-gray-400">加入时间</dt>
        <dd class="text-right">{{ admin.joinedAt }}</dd>
      </dl>
    </ModalDialog>

    <ModalDialog
      cancelText="取消"
      confirmText="退出登录"
      danger
      :open="logoutConfirmOpen"
      title="退出登录"
      @cancel="logoutConfirmOpen = false"
      @confirm="confirmLogout"
    >
      退出后将清除本机的演示数据并返回首页。确定继续吗？
    </ModalDialog>
  </header>
</template>

<style scoped>
  .menu-enter-active,
  .menu-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  .menu-enter-from,
  .menu-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
