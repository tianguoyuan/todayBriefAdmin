<script setup lang="ts">
  import { APP_NAME, APP_VERSION } from '~/utils/constants'

  const route = useRoute()
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const comments = useCommentStore()

  const unreadComments = computed(() => comments.unreadCount.value)

  const navItems = [
    { icon: 'i-carbon-dashboard', label: '仪表盘', to: '/' },
    { icon: 'i-carbon-document', label: '新闻管理', to: '/news' },
    { icon: 'i-carbon-categories', label: '分类管理', to: '/categories' },
    { icon: 'i-carbon-chat', label: '评论管理', to: '/comments' },
    { icon: 'i-carbon-user-multiple', label: '用户管理', to: '/users' },
    { icon: 'i-carbon-document-audio', label: '操作日志', to: '/audit' },
    { icon: 'i-carbon-settings-adjust', label: '设置', to: '/settings' },
  ]

  function isActive(to: string) {
    if (to === '/') return route.path === '/'
    return route.path === to || route.path.startsWith(`${to}/`)
  }

  function onNavigate() {
    if (isMobile.value) closeAdminSidebar()
  }
</script>

<template>
  <div>
    <Transition name="fade">
      <div
        v-if="isMobile && adminSidebarOpen"
        class="bg-black/40 inset-0 fixed z-40 lg:hidden"
        @click="closeAdminSidebar()"
      />
    </Transition>

    <aside
      class="border-r border-gray-200/70 bg-white flex flex-col transition-all duration-200 inset-y-0 left-0 fixed z-50 dark:border-gray-700/70 dark:bg-gray-900 lg:h-screen lg:top-0 lg:sticky"
      :class="adminSidebarOpen ? 'w-56 translate-x-0' : 'w-56 -translate-x-full lg:w-16 lg:translate-x-0'"
    >
      <RouterLink
        class="border-b border-gray-200/70 flex flex-shrink-0 gap-2.5 h-14 transition-colors items-center dark:border-gray-700/70 hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
        :class="adminSidebarOpen ? 'px-4' : 'justify-center px-2'"
        title="回到首页"
        to="/"
        @click="onNavigate"
      >
        <div
          class="text-lg text-white rounded-xl shrink-0 grid h-9 w-9 shadow-sm place-items-center from-teal-500 to-sky-500 bg-gradient-to-br"
        >
          <div class="i-carbon-bring-to-front" />
        </div>
        <div v-if="adminSidebarOpen" class="flex-1 min-w-0">
          <p class="text-sm leading-tight font-bold truncate">{{ APP_NAME }}后台</p>
          <p class="text-[10px] text-gray-400 truncate">Today Brief Admin</p>
        </div>
      </RouterLink>

      <nav class="px-3 py-4 flex-1 overflow-y-auto space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          class="text-sm px-3 py-2 rounded-lg flex gap-3 transition-colors items-center"
          :class="[
            isActive(item.to)
              ? 'bg-teal-600/10 font-medium text-teal-600 dark:text-teal-400'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            adminSidebarOpen ? '' : 'justify-center px-0',
          ]"
          :title="item.label"
          :to="item.to"
          @click="onNavigate"
        >
          <div class="text-lg shrink-0" :class="item.icon" />
          <span v-if="adminSidebarOpen" class="truncate">{{ item.label }}</span>
          <span
            v-if="item.to === '/comments' && unreadComments > 0"
            class="text-[10px] text-white leading-none px-1 py-0.5 text-center rounded-full bg-amber-500 shrink-0 min-w-4"
          >
            {{ unreadComments > 99 ? '99+' : unreadComments }}
          </span>
        </RouterLink>
      </nav>

      <div
        v-if="adminSidebarOpen"
        class="text-[11px] text-gray-400 leading-relaxed px-4 py-3 border-t border-gray-200/70 flex flex-shrink-0 items-center justify-between dark:border-gray-700/70"
      >
        <div>
          <p>{{ APP_NAME }} · 内容管理</p>
          <p>{{ APP_VERSION }} · 数据保存于本地</p>
        </div>
        <button
          class="icon-btn text-base text-gray-400 hover:text-teal-500"
          title="收起侧边栏"
          type="button"
          @click="toggleAdminSidebar()"
        >
          <div class="i-carbon-chevron-left" />
        </button>
      </div>
      <div
        v-else
        class="py-2 border-t border-gray-200/70 flex flex-shrink-0 flex-col gap-1 items-center dark:border-gray-700/70"
      >
        <button
          class="icon-btn text-lg text-gray-400 hover:text-teal-500"
          title="展开侧边栏"
          type="button"
          @click="toggleAdminSidebar()"
        >
          <div class="i-carbon-chevron-right" />
        </button>
        <RouterLink
          class="icon-btn text-lg text-gray-400 hover:text-teal-500"
          title="设置"
          to="/settings"
          @click="onNavigate"
        >
          <div class="i-carbon-settings-adjust" />
        </RouterLink>
      </div>
    </aside>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
