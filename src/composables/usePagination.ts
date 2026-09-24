export function usePagination<T>(source: MaybeRefOrGetter<T[]>, pageSize = 10) {
  const page = ref(1)
  const size = ref(pageSize)
  const total = computed(() => toValue(source).length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))

  const pageItems = computed(() => {
    const start = (page.value - 1) * size.value
    return toValue(source).slice(start, start + size.value)
  })

  watch(
    total,
    () => {
      page.value = 1
    },
    { flush: 'sync' },
  )

  function setPage(next: number) {
    page.value = Math.min(totalPages.value, Math.max(1, next))
  }

  return {
    page,
    pageItems,
    setPage,
    size,
    total,
    totalPages,
  }
}
