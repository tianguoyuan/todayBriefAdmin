let timer: ReturnType<typeof setInterval> | undefined

export function useScheduledPublish() {
  const news = useNewsStore()

  function publishOnce() {
    news.publishDueNews()
  }

  onMounted(() => {
    publishOnce()
    timer = setInterval(publishOnce, 30_000)
  })

  onUnmounted(() => {
    clearInterval(timer)
  })
}
