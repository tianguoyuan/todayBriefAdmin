import { STORAGE_PREFIX } from '~/utils/constants'

/** 侧边栏展开状态：桌面端控制宽窄，移动端控制抽屉显隐 */
export const adminSidebarOpen = useLocalStorage<boolean>(`${STORAGE_PREFIX}sidebar-open`, true)

export function toggleAdminSidebar() {
  adminSidebarOpen.value = !adminSidebarOpen.value
}

export function closeAdminSidebar() {
  adminSidebarOpen.value = false
}
