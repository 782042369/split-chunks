import type { ModuleInfo } from './type'

import { describe, expect, it, vi } from 'vitest'

import { staticImportedScan } from './staticImportScan'

describe('staticImportedScan', () => {
  const createMockModuleInfo = (importers: string[] = [], isEntry = false): ModuleInfo => ({
    importers,
    isEntry,
  })

  const createGetModuleInfo = (modules: Map<string, ModuleInfo>) => {
    return (id: string): ModuleInfo | null => modules.get(id) ?? null
  }

  it('应该正确识别入口模块为静态导入', () => {
    const modules = new Map([
      ['/entry.js', createMockModuleInfo([], true)],
    ])
    const getModuleInfo = createGetModuleInfo(modules)
    const cache = new Map<string, boolean>()

    expect(staticImportedScan('/entry.js', getModuleInfo, cache)).toBe(true)
    expect(cache.get('/entry.js')).toBe(true)
  })

  it('应该正确识别被入口模块直接导入的模块为静态导入', () => {
    const modules = new Map([
      ['/entry.js', createMockModuleInfo([], true)],
      ['/lib.js', createMockModuleInfo(['/entry.js'], false)],
    ])
    const getModuleInfo = createGetModuleInfo(modules)
    const cache = new Map<string, boolean>()

    expect(staticImportedScan('/lib.js', getModuleInfo, cache)).toBe(true)
    expect(cache.get('/lib.js')).toBe(true)
  })

  it('应该正确识别动态导入的模块', () => {
    const modules = new Map([
      ['/entry.js', createMockModuleInfo([], true)],
      ['/lib.js', createMockModuleInfo([], false)],
    ])
    const getModuleInfo = createGetModuleInfo(modules)
    const cache = new Map<string, boolean>()

    expect(staticImportedScan('/lib.js', getModuleInfo, cache)).toBe(false)
  })

  it('应该正确处理多层级导入', () => {
    const modules = new Map([
      ['/entry.js', createMockModuleInfo([], true)],
      ['/lib1.js', createMockModuleInfo(['/entry.js'], false)],
      ['/lib2.js', createMockModuleInfo(['/lib1.js'], false)],
      ['/lib3.js', createMockModuleInfo(['/lib2.js'], false)],
    ])
    const getModuleInfo = createGetModuleInfo(modules)
    const cache = new Map<string, boolean>()

    expect(staticImportedScan('/lib3.js', getModuleInfo, cache)).toBe(true)
  })

  it('应该正确处理混合静态和动态导入', () => {
    const modules = new Map([
      ['/entry.js', createMockModuleInfo([], true)],
      ['/static-lib.js', createMockModuleInfo(['/entry.js'], false)],
      ['/dynamic-lib.js', createMockModuleInfo([], false)],
    ])
    const getModuleInfo = createGetModuleInfo(modules)
    const cache = new Map<string, boolean>()

    expect(staticImportedScan('/static-lib.js', getModuleInfo, cache)).toBe(true)
    expect(staticImportedScan('/dynamic-lib.js', getModuleInfo, cache)).toBe(false)
  })

  it('应该使用缓存避免重复计算', () => {
    const modules = new Map([
      ['/entry.js', createMockModuleInfo([], true)],
      ['/lib.js', createMockModuleInfo(['/entry.js'], false)],
    ])
    const getModuleInfo = vi.fn(createGetModuleInfo(modules))
    const cache = new Map<string, boolean>()

    staticImportedScan('/lib.js', getModuleInfo, cache)
    expect(getModuleInfo).toHaveBeenCalledTimes(2) // /lib.js 和 /entry.js

    staticImportedScan('/lib.js', getModuleInfo, cache)
    expect(getModuleInfo).toHaveBeenCalledTimes(2) // 应该使用缓存，不再调用
  })

  it('应该正确处理循环依赖', () => {
    const modules = new Map([
      ['/module-a.js', createMockModuleInfo(['/module-b.js'], false)],
      ['/module-b.js', createMockModuleInfo(['/module-a.js'], false)],
    ])
    const getModuleInfo = createGetModuleInfo(modules)
    const cache = new Map<string, boolean>()

    expect(staticImportedScan('/module-a.js', getModuleInfo, cache)).toBe(false)
    expect(staticImportedScan('/module-b.js', getModuleInfo, cache)).toBe(false)
  })

  it('应该处理不存在的模块', () => {
    const modules = new Map<string, ModuleInfo>()
    const getModuleInfo = createGetModuleInfo(modules)
    const cache = new Map<string, boolean>()

    expect(staticImportedScan('/non-existent.js', getModuleInfo, cache)).toBe(false)
  })

  it('应该正确追踪 importChain', () => {
    const modules = new Map([
      ['/entry.js', createMockModuleInfo([], true)],
      ['/lib1.js', createMockModuleInfo(['/entry.js'], false)],
      ['/lib2.js', createMockModuleInfo(['/lib1.js'], false)],
    ])
    const getModuleInfo = createGetModuleInfo(modules)

    // 第一次调用应该正常工作
    expect(staticImportedScan('/lib2.js', getModuleInfo, new Map(), [])).toBe(true)

    // 如果 importChain 中已经包含当前模块，应该检测到循环依赖
    // 使用新的 cache 避免缓存干扰
    expect(staticImportedScan('/lib2.js', getModuleInfo, new Map(), ['/lib2.js'])).toBe(false)
  })
})
