# @xiaowaibuzheng/rolldown-vite-split-chunks

Vite插件，基于rolldown实现代码分割功能

## 环境要求

- Node.js >= 20
- Vite >= 7
- rolldown-vite >= 7

## 安装

```bash
npm install @xiaowaibuzheng/rolldown-vite-split-chunks
# 或
pnpm add @xiaowaibuzheng/rolldown-vite-split-chunks
```

## 使用方式

1. 在vite.config.ts中引入插件：

```ts
import { splitChunks } from '@xiaowaibuzheng/rolldown-vite-split-chunks'

export default defineConfig({
  plugins: [
    splitChunks()
  ]
})
```
