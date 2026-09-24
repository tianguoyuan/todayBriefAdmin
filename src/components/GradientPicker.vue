<script setup lang="ts">
  import { avatarPalettes } from '~/utils/palettes'

  const model = defineModel<[string, string]>({ required: true })

  function isSelected(palette: [string, string]) {
    return model.value[0] === palette[0] && model.value[1] === palette[1]
  }
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="palette in avatarPalettes"
      :key="palette[0]"
      class="rounded-lg h-9 w-14 transition-all"
      :class="
        isSelected(palette)
          ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-gray-900'
          : 'opacity-80 hover:opacity-100'
      "
      :style="{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }"
      :title="`${palette[0]} → ${palette[1]}`"
      type="button"
      @click="model = [palette[0], palette[1]]"
    />
  </div>
</template>
