import { STORAGE_PREFIX } from '~/utils/constants'

export interface AuthUser {
  username: string
  email: string
  role: string
  avatar: string
  joinedAt: string
}

export const AUTH_USERNAME = 'admin'

export const AUTH_PASSWORD = '123456'

const KEY = `${STORAGE_PREFIX}auth`

const authUser = useLocalStorage<AuthUser | null>(KEY, {
  avatar: '',
  email: '',
  joinedAt: '',
  role: '',
  username: '',
})

export function useAuthStore() {
  const isLoggedIn = computed(() => authUser.value !== null && authUser.value.username)

  function login(username: string, password: string) {
    if (username.trim() === AUTH_USERNAME && password === AUTH_PASSWORD) {
      authUser.value = {
        avatar: '管',
        email: 'admin@todaybrief',
        joinedAt: '2024-01-04',
        role: '超级管理员',
        username: '管理员',
      }
      logAudit('other', '系统', '管理员登录成功')
      return true
    }
    logAudit('other', '系统', `登录失败（用户「${username || '未填写'}」）`)
    return false
  }

  function logout() {
    authUser.value = null
    logAudit('other', '系统', '管理员退出登录')
  }

  return {
    isLoggedIn,
    login,
    logout,
    user: authUser,
  }
}
