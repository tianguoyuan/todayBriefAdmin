<script setup lang="ts">
  // 布局入口：侧边栏 + 顶栏 + 内容区
  useScheduledPublish()
  const route = useRoute()
  const isLogin = computed(() => route.path === '/login')
</script>

<template>
  <div class="text-gray-800 bg-gray-100 flex min-h-screen transition-colors dark:text-gray-200 dark:bg-gray-950">
    <template v-if="isLogin">
      <RouterView />
    </template>
    <template v-else>
      <AdminSidebar />
      <GlobalSearch />
      <div class="flex flex-1 flex-col min-w-0">
        <AdminTopbar />
        <main class="mx-auto p-4 flex-1 max-w-7xl w-full lg:p-8 md:p-6">
          <RouterView v-slot="{ Component }">
            <Transition mode="out-in" name="page">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </main>
        <footer class="text-xs text-gray-400 px-4 py-4 text-center">
          今日快讯管理后台 · 演示项目，数据仅保存在本地浏览器
        </footer>
      </div>
    </template>
  </div>
</template>

<style scoped>
  .page-enter-active,
  .page-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .page-enter-from {
    opacity: 0;
    transform: translateY(8px);
  }

  .page-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }
</style>
