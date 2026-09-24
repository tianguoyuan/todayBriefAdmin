import { APP_ADMIN_NAME } from '~/utils/constants'

export const pageTitle = ref('仪表盘')

export function usePageTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    const t = toValue(title)
    pageTitle.value = t
    document.title = `${APP_ADMIN_NAME} · ${t}`
  })
}
