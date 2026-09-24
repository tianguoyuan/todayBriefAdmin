import { ref, watch } from 'vue'

export function useDebouncedRef<T>(initialValue: T, delay = 250) {
  const value = ref(initialValue)
  const debounced = ref(initialValue)
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(value, (newValue) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = newValue
    }, delay)
  })

  return {
    debounced,
    value,
  }
}

export function useDebouncedSearch<T extends string = string>(initialValue: T, delay = 250) {
  const { debounced, value } = useDebouncedRef(initialValue, delay)

  return {
    debounced: debounced as Readonly<Ref<T>>,
    input: value,
  }
}
