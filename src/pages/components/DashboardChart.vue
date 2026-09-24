<script setup lang="ts">
  import { LineChart } from 'echarts/charts'
  import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
  import * as echarts from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

  const props = defineProps<Props>()

  echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

  interface TrendPoint {
    label: string
    count: number
    percent: number
  }

  interface Props {
    trendData: TrendPoint[]
    trendRange: 7 | 30
    peakIndex: number
    peakCount: number
  }

  const chartRef = ref<HTMLDivElement>()
  let chartInstance: echarts.ECharts | null = null

  const lineGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { color: '#14b8a6', offset: 0 },
    { color: '#0ea5e9', offset: 1 },
  ])
  const areaGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { color: 'rgba(20,184,166,0.28)', offset: 0 },
    { color: 'rgba(14,165,233,0.02)', offset: 1 },
  ])

  function initChart() {
    if (!chartRef.value || chartInstance) return
    chartInstance = echarts.init(chartRef.value)
    updateChart()
    window.addEventListener('resize', resizeChart)
  }

  function updateChart() {
    if (!chartInstance) return
    const labels = props.trendData.map((d) => d.label)
    const counts = props.trendData.map((d) => d.count)
    const maxCount = Math.max(1, ...counts)

    chartInstance.setOption({
      animationDuration: 500,
      animationEasing: 'cubicOut',
      grid: {
        bottom: 30,
        left: 40,
        right: 20,
        top: 10,
      },
      series: [
        {
          areaStyle: {
            color: areaGradient,
          },
          data: counts,
          emphasis: {
            focus: 'series',
          },
          itemStyle: {
            borderColor: (params: { dataIndex: number }) =>
              params.dataIndex === props.peakIndex
                ? '#d97706'
                : params.dataIndex === counts.length - 1
                  ? '#0d9488'
                  : '#14b8a6',
            borderWidth: 1.5,
            color: (params: { dataIndex: number }) => (params.dataIndex === props.peakIndex ? '#f59e0b' : '#fff'),
          },
          lineStyle: {
            color: lineGradient,
            width: 2.5,
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          type: 'line',
        },
      ],
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderColor: '#374151',
        borderWidth: 1,
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0]
          return `${p.name}：发布 ${p.value} 条`
        },
        padding: [8, 12],
        textStyle: { color: '#fff', fontSize: 12 },
        trigger: 'axis',
      },
      xAxis: {
        axisLabel: { color: '#9ca3af', fontSize: 10, interval: 0 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false },
        boundaryGap: false,
        data: labels,
        type: 'category',
      },
      yAxis: {
        axisLabel: { color: '#9ca3af', fontSize: 10, formatter: '{value}' },
        axisLine: { show: false },
        axisTick: { show: false },
        max: maxCount < 5 ? 5 : Math.ceil(maxCount / 5) * 5,
        min: 0,
        splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
        splitNumber: 4,
        type: 'value',
      },
    })
  }

  function resizeChart() {
    chartInstance?.resize()
  }

  onMounted(() => {
    initChart()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart)
    chartInstance?.dispose()
    chartInstance = null
  })

  watch([() => props.trendData, () => props.trendRange], () => {
    updateChart()
  })
</script>

<template>
  <div class="w-full aspect-[4/1]">
    <div ref="chartRef" class="h-full w-full" />
  </div>
</template>

<style scoped></style>
