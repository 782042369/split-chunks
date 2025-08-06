import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'], // 指定入口文件
  outDir: 'es', // 指定输出目录
  format: ['esm'], // 生成ESM格式的文件
  dts: true, // 生成类型定义文件（d.ts）
  clean: true, // 打包前清除输出目录
  unbundle: true,
  external: [
    /es-module-lexer/,
    /vite/,
  ], // 排除的依赖项
})
