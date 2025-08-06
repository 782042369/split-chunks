# @xiaowaibuzheng/rolldown-vite-split-chunks

Vite插件，基于rolldown实现HTTP/2优化的node_modules分包方案

## ✨ 特性

- 自动将node_modules拆分为多个chunk
- 支持HTTP/2多路复用优化
- 可配置的chunk命名规则
- 完善的TypeScript类型支持

## 📦 环境要求

- Node.js >= 20.0.0
- Vite >= 7.0.0
- rolldown-vite >= 7.0.0

## 🔧 安装

```bash
# 使用npm
npm install @xiaowaibuzheng/rolldown-vite-split-chunks

# 使用pnpm
pnpm add @xiaowaibuzheng/rolldown-vite-split-chunks

# 使用yarn
yarn add @xiaowaibuzheng/rolldown-vite-split-chunks
```

## 🚀 使用方式

### 基本配置

```ts
import { splitChunks } from '@xiaowaibuzheng/rolldown-vite-split-chunks'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    splitChunks()
  ]
})
```

### 高级配置选项

```ts
splitChunks({
  /**
   * vendor chunk前缀，默认: 'p-'
   * 示例: p-react, p-lodash
   */
  vendor_prefix?: string

  /**
   * 异步chunk后缀，默认: '-async'
   * 示例: p-react-async
   */
  async_suffix?: string
})
```

## 💡 最佳实践

1. **生产环境优化**:
   ```ts
   splitChunks({
     vendor_prefix: 'vendor-',
     async_suffix: '.async'
   })
   ```

## ️ 注意事项

- 确保项目使用HTTP/2服务器

## ❓ 常见问题

**Q: 如何验证分包是否生效？**
A: 构建后检查dist目录下的chunk文件命名

**Q: 为什么我的node_modules没有被拆分？**
A: 检查是否满足环境要求，并确保没有其他插件冲突

## 📄 License

MIT
