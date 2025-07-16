/*
 * @Author: yanghongxuan
 * @Date: 2025-02-28 17:35:18
 * @Description:
 * @LastEditTime: 2025-04-10 14:16:13
 * @LastEditors: yanghongxuan
 */
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'], // 指定入口文件
  outDir: 'es', // 指定输出目录
  format: ['esm'], // 生成ESM格式的文件
  dts: true, // 生成类型定义文件（d.ts）
  clean: true, // 打包前清除输出目录
  watch: process.env.NODE_ENV === 'development', // 如果处于开发模式，启用监听
  unbundle: true,
  external: [
    /es-module-lexer/,
  ], // 排除的依赖项
})
