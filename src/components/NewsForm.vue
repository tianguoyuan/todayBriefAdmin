<script setup lang="ts">
  import type { NewsDraft } from '~/composables/newsStore'
  import { avatarPalettes } from '~/utils/palettes'

  const props = withDefaults(
    defineProps<{
      initial?: Partial<NewsDraft>
    }>(),
    {
      initial: () => ({}),
    },
  )

  const emit = defineEmits<{
    submit: [draft: NewsDraft]
    cancel: []
    autosave: [draft: NewsDraft]
  }>()

  const { newsCategories } = useCategoryStore()

  const nowTime = () => new Date().toTimeString().slice(0, 5)

  const form = reactive<NewsDraft>({
    category: props.initial.category ?? newsCategories.value[0]?.id ?? 'domestic',
    content: props.initial.content ?? '',
    gradient: props.initial.gradient ?? avatarPalettes[0],
    pinned: props.initial.pinned ?? false,
    reads: props.initial.reads ?? '0',
    scheduledAt: props.initial.scheduledAt ?? undefined,
    source: props.initial.source ?? '',
    status: props.initial.status ?? 'published',
    summary: props.initial.summary ?? '',
    tag: props.initial.tag ?? '',
    time: props.initial.time ?? nowTime(),
    title: props.initial.title ?? '',
  })

  const scheduledAtText = ref(form.scheduledAt ? new Date(form.scheduledAt).toISOString().slice(0, 16) : '')

  watch(scheduledAtText, (value) => {
    form.scheduledAt = value ? new Date(value).getTime() : undefined
  })

  const isEditing = computed(() => 'id' in props.initial)

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined

  watch(
    form,
    () => {
      if (!isEditing.value) return
      clearTimeout(autosaveTimer)
      autosaveTimer = setTimeout(() => {
        emit('autosave', { ...form, gradient: [form.gradient[0], form.gradient[1]] })
      }, 2000)
    },
    { deep: true },
  )

  const errors = reactive<Record<string, string>>({})

  function validate() {
    errors.title = form.title.trim() ? '' : '请输入新闻标题'
    errors.category = form.category ? '' : '请选择新闻分类'
    errors.source = form.source.trim() ? '' : '请输入来源'
    errors.summary = form.summary.trim() ? '' : '请输入新闻摘要'
    errors.content = form.content.trim() ? '' : '请输入正文内容'
    return !Object.values(errors).some(Boolean)
  }

  function submit() {
    if (!validate()) return
    emit('submit', { ...form, gradient: [form.gradient[0], form.gradient[1]] })
  }

  function onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      submit()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <form class="p-5 card max-w-4xl space-y-5 md:p-6" @submit.prevent="submit">
    <div>
      <label class="label" for="news-title">标题</label>
      <input
        id="news-title"
        v-model="form.title"
        class="input"
        maxlength="60"
        placeholder="请输入新闻标题（60 字以内）"
        type="text"
      />
      <p v-if="errors.title" class="text-xs text-red-500 mt-1">{{ errors.title }}</p>
    </div>

    <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
      <div>
        <label class="label" for="news-category">分类</label>
        <select id="news-category" v-model="form.category" class="input">
          <option v-for="category in newsCategories" :key="category.id" :value="category.id">
            {{ category.label }}
          </option>
        </select>
        <p v-if="errors.category" class="text-xs text-red-500 mt-1">{{ errors.category }}</p>
      </div>
      <div>
        <label class="label" for="news-source">来源</label>
        <input id="news-source" v-model="form.source" class="input" placeholder="例如：新华网" type="text" />
        <p v-if="errors.source" class="text-xs text-red-500 mt-1">{{ errors.source }}</p>
      </div>
    </div>

    <div class="gap-4 grid grid-cols-2 md:grid-cols-4">
      <div>
        <label class="label" for="news-time">发布时间</label>
        <div class="flex gap-2">
          <input id="news-time" v-model="form.time" class="input" placeholder="HH:MM" type="text" />
          <button
            class="btn-ghost px-3 py-0 shrink-0"
            title="填入当前时间"
            type="button"
            @click="form.time = nowTime()"
          >
            现在
          </button>
        </div>
      </div>
      <div>
        <label class="label" for="news-reads">阅读量</label>
        <input id="news-reads" v-model="form.reads" class="input" placeholder="例如：12.6万" type="text" />
      </div>
      <div class="col-span-2">
        <label class="label" for="news-tag">标签</label>
        <input id="news-tag" v-model="form.tag" class="input" placeholder="例如：热点 / 独家 / 科技" type="text" />
      </div>
    </div>

    <div>
      <label class="label" for="news-summary">摘要</label>
      <textarea
        id="news-summary"
        v-model="form.summary"
        class="input min-h-20 resize-y"
        placeholder="一句话概括新闻内容"
      />
      <p v-if="errors.summary" class="text-xs text-red-500 mt-1">{{ errors.summary }}</p>
    </div>

    <div>
      <label class="label" for="news-content">正文</label>
      <textarea
        id="news-content"
        v-model="form.content"
        class="input text-xs leading-relaxed font-mono min-h-64 resize-y"
        placeholder="输入新闻正文，可使用空行分段"
      />
      <p v-if="errors.content" class="text-xs text-red-500 mt-1">{{ errors.content }}</p>
    </div>

    <div>
      <span class="label">卡片配色</span>
      <GradientPicker v-model="form.gradient" />
    </div>

    <div class="flex flex-wrap gap-6 items-end">
      <div>
        <span class="label">发布状态</span>
        <div class="flex gap-4">
          <label class="text-sm flex gap-1.5 cursor-pointer items-center">
            <input v-model="form.status" class="accent-teal-600" type="radio" value="published" />
            已发布
          </label>
          <label class="text-sm flex gap-1.5 cursor-pointer items-center">
            <input v-model="form.status" class="accent-teal-600" type="radio" value="draft" />
            草稿
          </label>
        </div>
      </div>
      <label class="text-sm flex gap-1.5 cursor-pointer items-center">
        <input v-model="form.pinned" class="accent-teal-600" type="checkbox" />
        设为置顶
      </label>
      <div>
        <span class="label">定时发布（可留空）</span>
        <input v-model="scheduledAtText" class="input" type="datetime-local" />
        <p v-if="form.scheduledAt" class="text-xs text-teal-600 mt-1 dark:text-teal-400">
          将于 {{ new Date(form.scheduledAt).toLocaleString('zh-CN') }} 自动发布
        </p>
      </div>
    </div>

    <div class="pt-4 border-t border-gray-100 flex gap-2 items-center justify-end dark:border-gray-800">
      <span class="text-xs text-gray-400 mr-auto">小技巧：按 Ctrl/Cmd + S 快速保存</span>
      <button class="btn-ghost" type="button" @click="emit('cancel')">取消</button>
      <button class="btn" type="submit">
        <div class="i-carbon-checkmark" />
        保存
      </button>
    </div>
  </form>
</template>
