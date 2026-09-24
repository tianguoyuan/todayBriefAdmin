<script setup lang="ts">
  withDefaults(
    defineProps<{
      open: boolean
      title?: string
      confirmText?: string
      cancelText?: string
      danger?: boolean
    }>(),
    {
      cancelText: '取消',
      confirmText: '确认',
      danger: false,
      title: '',
    },
  )

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="p-4 grid inset-0 place-items-center fixed z-50">
        <div class="bg-black/40 inset-0 absolute" @click="emit('cancel')" />
        <div class="p-5 card max-w-md w-full relative z-10">
          <h3 v-if="title" class="text-base font-bold mb-4">{{ title }}</h3>
          <div class="text-sm text-gray-600 leading-relaxed max-h-70vh overflow-y-auto dark:text-gray-300">
            <slot />
          </div>
          <div class="mt-6 flex gap-2 justify-end">
            <button class="btn-ghost" type="button" @click="emit('cancel')">{{ cancelText }}</button>
            <button
              class="btn"
              :class="{ 'bg-red-500 hover:bg-red-600': danger }"
              type="button"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .dialog-enter-active,
  .dialog-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  .dialog-enter-from,
  .dialog-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
</style>
