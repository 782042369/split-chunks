import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  stylistic: {
    indent: 2, // 缩进
    semi: false, // 语句分号
    quotes: 'single', // 单引号
  },
  rules: {
    'node/prefer-global/process': 'off',
  },
  ignores: [
    '**/node_modules/**',
    'pnpm-lock.yaml',
  ],
  formatters: true,
  jsonc: false,
  yaml: false,
})
