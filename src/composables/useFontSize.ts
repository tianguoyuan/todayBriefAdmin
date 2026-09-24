import { useLocalStorage } from '@vueuse/core'
import { watchEffect } from 'vue'

export type FontScale = 'sm' | 'md' | 'lg'

const fontScaleMap: Record<FontScale, string> = {
  lg: '18px',
  md: '16px',
  sm: '14px',
}

export const fontSize = useLocalStorage<FontScale>('todayBriefAdmin:font-size', 'md')

export function applyFontScale() {
  document.documentElement.style.fontSize = fontScaleMap[fontSize.value]
}

watchEffect(() => {
  applyFontScale()
})
