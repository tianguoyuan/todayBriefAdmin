import { ref } from 'vue'

interface ToastOptions {
  duration?: number
}

export function useToast(options: ToastOptions = {}) {
  const { duration = 2500 } = options

  const tip = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined

  function show(message: string) {
    tip.value = message
    clearTimeout(timer)
    timer = setTimeout(() => {
      tip.value = ''
    }, duration)
  }

  function hide() {
    tip.value = ''
    clearTimeout(timer)
  }

  return {
    hide,
    show,
    tip,
  }
}

export function useToastTransition(name = 'toast') {
  return name
}
