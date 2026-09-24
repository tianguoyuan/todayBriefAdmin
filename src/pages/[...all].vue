<script lang="ts" setup>
  usePageTitle('页面不存在')
</script>

<template>
  <div class="p-8 text-center card flex flex-col gap-4 min-h-70vh items-center justify-center">
    <div class="i-carbon-warning text-5xl text-orange-400" />
    <div>
      <p class="text-sm text-gray-400">页面不存在或已被移除</p>
      <p class="text-xs text-gray-400 mt-1">检查地址是否正确，或返回后台首页继续操作</p>
    </div>
    <RouterLink class="btn" to="/">
      <div class="i-carbon-home" />
      返回仪表盘
    </RouterLink>
  </div>
</template>
