<script setup lang="ts">
  import DashboardChart from './DashboardChart.vue'
  import DashboardTrendHeader from './DashboardTrendHeader.vue'

  interface Props {
    trendData: Array<{ label: string; count: number; percent: number }>
    trendRange: 7 | 30
    days: number
    avgPerDay: string
    peakIndex: number
    peakCount: number
  }

  defineProps<Props>()

  const emit = defineEmits<{
    rangeChange: [range: 7 | 30]
  }>()

  function handleRangeChange(range: 7 | 30) {
    emit('rangeChange', range)
  }
</script>

<template>
  <div class="p-5 card">
    <DashboardTrendHeader
      :avgPerDay="avgPerDay"
      :days="days"
      :peakCount="peakCount"
      :trendRange="trendRange"
      @range-change="handleRangeChange"
    />
    <DashboardChart :peakCount="peakCount" :peakIndex="peakIndex" :trendData="trendData" :trendRange="trendRange" />
  </div>
</template>

<style scoped></style>
