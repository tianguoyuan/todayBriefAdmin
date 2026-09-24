import { defineConfig, presetAttributify, presetIcons, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  shortcuts: [
    [
      'btn',
      'inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-medium text-white transition-colors cursor-pointer select-none hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50',
    ],
    [
      'btn-ghost',
      'inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-100 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800',
    ],
    [
      'btn-danger',
      'inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white transition-colors cursor-pointer select-none hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50',
    ],
    ['card', 'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700/80 dark:bg-gray-900'],
    [
      'input',
      'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-color placeholder:(text-gray-400) focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
    ],
    ['label', 'mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300'],
    ['badge', 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'],
  ],
})
