<script setup lang="ts">
  import { useToast } from '~/composables'
  import DashboardCategoryStats from './components/DashboardCategoryStats.vue'
  import DashboardExport from './components/DashboardExport.vue'
  import DashboardHotComments from './components/DashboardHotComments.vue'
  import DashboardQuickLinks from './components/DashboardQuickLinks.vue'
  import DashboardRecentNews from './components/DashboardRecentNews.vue'
  import DashboardStats from './components/DashboardStats.vue'
  import DashboardTrend from './components/DashboardTrend.vue'

  usePageTitle('仪表盘')

  const { tip } = useToast()

  const news = useNewsStore()
  const comments = useCommentStore()
  const users = useUserStore()
  const categories = useCategoryStore()

  const categoryStats = computed(() => {
    const newsCounts = new Map<string, number>()
    news.list.value.forEach((item) => {
      newsCounts.set(item.category, (newsCounts.get(item.category) ?? 0) + 1)
    })
    const totalNews = news.list.value.length || 1
    return categories.newsCategories.value.map((category) => ({
      category,
      count: newsCounts.get(category.id) ?? 0,
      percent: Math.round(((newsCounts.get(category.id) ?? 0) / totalNews) * 100),
    }))
  })

  const stats = computed(() => [
    { hint: '含草稿', icon: 'i-carbon-document', label: '新闻总数', tone: 'bg-teal-500', value: news.total.value },
    {
      hint: '在线可见',
      icon: 'i-carbon-checkmark-outline',
      label: '已发布',
      tone: 'bg-sky-500',
      value: news.publishedCount.value,
    },
    {
      hint: '待发布',
      icon: 'i-carbon-document-blank',
      label: '草稿',
      tone: 'bg-amber-500',
      value: news.draftCount.value,
    },
    {
      hint: `获赞 ${comments.totalLikes.value}`,
      icon: 'i-carbon-chat',
      label: '评论总数',
      tone: 'bg-indigo-500',
      value: comments.total.value,
    },
    {
      hint: `活跃 ${users.activeCount.value}`,
      icon: 'i-carbon-user-multiple',
      label: '用户总数',
      tone: 'bg-violet-500',
      value: users.total.value,
    },
    {
      hint: '内容分类',
      icon: 'i-carbon-categories',
      label: '分类数',
      tone: 'bg-orange-500',
      value: categories.total.value,
    },
  ])

  const recentNews = computed(() => news.sortedNews().slice(0, 5))
  const hotComments = computed(() =>
    comments
      .sortedComments()
      .slice(0, 5)
      .sort((a, b) => b.likes - a.likes),
  )

  const quickLinks = [
    { desc: '撰写并发布一条新内容', icon: 'i-carbon-add', label: '新建新闻', to: '/news/new' },
    { desc: '管理用户与评论', icon: 'i-carbon-chat', label: '评论审核', to: '/comments' },
    { desc: '维护内容分类', icon: 'i-carbon-categories', label: '分类管理', to: '/categories' },
    { desc: '查看并管理用户', icon: 'i-carbon-user-multiple', label: '用户管理', to: '/users' },
    { desc: '数据与界面偏好', icon: 'i-carbon-settings-adjust', label: '系统设置', to: '/settings' },
  ]

  const trendRange = ref<7 | 30>(7)

  const newsByDay = computed(() => {
    const map = new Map<string, number>()
    const now = Date.now()
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now - i * 86_400_000)
      day.setHours(0, 0, 0, 0)
      const key = `${day.getMonth() + 1}/${day.getDate()}`
      map.set(key, 0)
    }
    news.list.value.forEach((item) => {
      const day = new Date(item.createdAt)
      day.setHours(0, 0, 0, 0)
      const key = `${day.getMonth() + 1}/${day.getDate()}`
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return map
  })

  const trendData = computed(() => {
    const labels: string[] = []
    const counts: number[] = []
    for (let i = trendRange.value - 1; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      day.setHours(0, 0, 0, 0)
      const key = `${day.getMonth() + 1}/${day.getDate()}`
      labels.push(key)
      counts.push(newsByDay.value.get(key) ?? 0)
    }
    const max = Math.max(1, ...counts)
    return labels.map((label, i) => ({ count: counts[i], label, percent: Math.round((counts[i] / max) * 100) }))
  })

  const days = computed(() => trendData.value.reduce((sum, item) => sum + item.count, 0))
  const avgPerDay = computed(() => (days.value / (trendData.value.length || 1)).toFixed(1))
  const peakIndex = computed(() => {
    let best = 0
    trendData.value.forEach((item, i) => {
      if (item.count > trendData.value[best].count) best = i
    })
    return best
  })
  const peakCount = computed(() => trendData.value[peakIndex.value]?.count ?? 0)

  function handleRangeChange(range: 7 | 30) {
    trendRange.value = range
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold">概览</h2>
      <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">欢迎回来，这里汇总了内容平台的运行情况。</p>
    </div>

    <DashboardExport
      :categories="categories.newsCategories"
      :commentsList="comments.sortedComments()"
      :newsList="news.sortedNews()"
      :usersList="users.list.value"
    />

    <DashboardStats :stats="stats" />

    <DashboardTrend
      :avgPerDay="avgPerDay"
      :days="days"
      :peakCount="peakCount"
      :peakIndex="peakIndex"
      :trendData="trendData"
      :trendRange="trendRange"
      @range-change="handleRangeChange"
    />

    <div class="gap-6 grid grid-cols-1 xl:grid-cols-3">
      <DashboardRecentNews :recentNews="recentNews" />
      <DashboardCategoryStats :categoryStats="categoryStats" />
    </div>

    <div class="gap-6 grid grid-cols-1 xl:grid-cols-3">
      <DashboardHotComments :hotComments="hotComments" />
      <DashboardQuickLinks :quickLinks="quickLinks" />
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
