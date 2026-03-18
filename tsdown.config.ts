import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'es',
  format: ['esm'],
  dts: true,
  clean: true,
  unbundle: true,
  deps: {
    neverBundle: [
      /^vite(\/.*)?$/, // vite 及其子路径不打包
    ],
  },
  target: 'es2020', // 目标环境，Node.js 20+ 支持的特性
})
