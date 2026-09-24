<script setup lang="ts">
  import { AUTH_PASSWORD, AUTH_USERNAME } from '~/composables/authStore'
  import { APP_ADMIN_NAME } from '~/utils/constants'

  usePageTitle('登录')

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const username = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const error = ref('')
  const submitting = ref(false)

  function submit() {
    if (!username.value.trim() || !password.value) {
      error.value = '请输入用户名和密码'
      return
    }
    submitting.value = true
    error.value = ''
    setTimeout(() => {
      if (auth.login(username.value, password.value)) {
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
        router.replace(redirect)
      }
 else {
        error.value = '用户名或密码错误'
      }
      submitting.value = false
    }, 300)
  }
</script>

<template>
  <div
    class="p-4 bg-slate-900 flex flex-1 min-h-screen items-center justify-center relative overflow-hidden from-indigo-700 to-emerald-700 via-teal-700 bg-gradient-to-br"
  >
    <div class="rounded-full bg-indigo-400/20 h-96 w-96 absolute blur-3xl -left-24 -top-24" />
    <div class="rounded-full bg-emerald-400/20 h-96 w-96 absolute blur-3xl -bottom-24 -right-24" />
    <div class="rounded-full bg-teal-300/10 h-64 w-64 top-1/3 absolute blur-3xl -left-10" />

    <div class="max-w-90 w-full">
      <div class="mb-8 text-center">
        <div class="text-5xl text-white">
          <div class="i-carbon-ibm-watson-machine-learning text-5xl" />
        </div>
        <h1 class="text-2xl text-white font-bold mt-4">{{ APP_ADMIN_NAME }}</h1>
        <p class="text-sm text-white/70 mt-1">登录以继续使用管理后台</p>
      </div>

      <form class="p-6 rounded-2xl bg-white shadow-xl space-y-4 dark:bg-gray-900" @submit.prevent="submit">
        <div>
          <label class="text-sm text-gray-600 mb-1 block dark:text-gray-300" for="login-username">用户名</label>
          <div class="relative">
            <div class="text-gray-400 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2">
              <div class="i-carbon-user-avatar" />
            </div>
            <input
              id="login-username"
              v-model="username"
              autocomplete="username"
              class="input pl-9"
              placeholder="请输入用户名"
              spellcheck="false"
              type="text"
            />
          </div>
        </div>

        <div>
          <label class="text-sm text-gray-600 mb-1 block dark:text-gray-300" for="login-password">密码</label>
          <div class="relative">
            <div class="text-gray-400 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2">
              <div class="i-carbon-password" />
            </div>
            <input
              id="login-password"
              v-model="password"
              autocomplete="current-password"
              class="input pl-9 pr-10"
              placeholder="请输入密码"
              :type="showPassword ? 'text' : 'password'"
            />
            <button
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              class="text-gray-400 right-2 top-1/2 absolute hover:text-gray-600 -translate-y-1/2 dark:hover:text-gray-200"
              type="button"
              @click="showPassword = !showPassword"
            >
              <div v-if="!showPassword" class="i-carbon-view" />
              <div v-else class="i-carbon-view-off" />
            </button>
          </div>
        </div>

        <Transition name="page">
          <div v-if="error" class="text-sm text-red-500 flex gap-1.5 items-center">
            <div class="i-carbon-warning" />
            {{ error }}
          </div>
        </Transition>

        <button class="btn w-full justify-center" :disabled="submitting" type="submit">
          <div v-if="submitting" class="i-carbon-circle-dash inline-block animate-spin" />
          <div v-else class="i-carbon-login" />
          {{ submitting ? '登录中…' : '登录' }}
        </button>

        <p class="text-xs text-gray-400 text-center">演示账号：{{ AUTH_USERNAME }} 密码：{{ AUTH_PASSWORD }}</p>
      </form>
    </div>

    <button
      class="text-white/80 right-4 top-4 absolute hover:text-white"
      title="切换主题"
      type="button"
      @click="() => toggleDark()"
    >
      <div class="i-carbon-moon dark:i-carbon-sun text-xl" />
    </button>
  </div>
</template>

<style scoped>
  .page-enter-active,
  .page-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .page-enter-from,
  .page-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
