import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: false,
    pnpm: true,
    unocss: true,
  },
  {
    name: 'custom/js',
    rules: {
      // 命名导入排序
      'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'natural' }],
      // 对象属性排序
      'perfectionist/sort-objects': ['error', { order: 'asc', type: 'natural' }],
    },
  },
  {
    files: ['**/*.vue'],
    name: 'custom/vue',
    rules: {
      // 模板属性必须用小驼峰（自定义组件 prop）
      'vue/attribute-hyphenation': ['error', 'never'],
      // 属性排序
      'vue/attributes-order': [
        'error',
        {
          alphabetical: true,
          order: [
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'GLOBAL',
            'UNIQUE',
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'OTHER_ATTR',
            'EVENTS',
            'CONTENT',
          ],
        },
      ],
      // 标签块顺序（v10 起 component-tags-order 已重命名为 block-order）
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style', 'route'],
        },
      ],
      // 模板中使用组件强制大驼峰
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      // prop 定义名称必须用小驼峰
      'vue/prop-name-casing': ['error', 'camelCase'],
    },
  },
  {
    name: 'custom/formatter-overrides',
    rules: {
      // 纯格式规则全部交给 prettier（`pnpm format`）统一负责
      'antfu/curly': 'off',
      'antfu/if-newline': 'off',
      'style/arrow-parens': 'off',
      'style/eol-last': 'off',
      'style/indent': 'off',
      'style/member-delimiter-style': 'off',
      'style/operator-linebreak': 'off',
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
)
