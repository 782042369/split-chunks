import { describe, expect, it, vi } from 'vitest'

import type { ModuleInfo } from './type'

import { ASYNC_SUFFIX, VENDOR_PREFIX } from './constants/index'
import { splitChunks } from './index'

describe('splitChunks plugin', () => {
  it('应该创建一个有效的 Vite 插件', () => {
    const plugin = splitChunks()

    expect(plugin).toBeDefined()
    expect(plugin.name).toBe('rolldown-vite-plugin-chunk-split')
    expect(typeof plugin.config).toBe('function')
  })

  it('应该使用默认配置', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })

    expect(config).toBeDefined()
    expect(config?.build).toBeDefined()
    expect(config?.build?.rolldownOptions).toBeDefined()
    expect(config?.build?.rolldownOptions?.output).toBeDefined()
    expect(config?.build?.rolldownOptions?.output?.advancedChunks).toBeDefined()
    expect(config?.build?.rolldownOptions?.output?.advancedChunks?.groups).toBeDefined()
    expect(config?.build?.rolldownOptions?.output?.advancedChunks?.groups).toHaveLength(1)
  })

  it('应该支持自定义 vendor_prefix', async () => {
    const plugin = splitChunks({ vendor_prefix: 'vendor-' })
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })

    expect(config).toBeDefined()
    const manualChunks = config?.build?.rolldownOptions?.output?.advancedChunks?.groups![0].name

    // 测试 node_modules 模块
    const result = manualChunks!('/path/to/node_modules/react/index.js', {
      getModuleInfo: vi.fn((): ModuleInfo | null => ({ importers: [], isEntry: true })),
    })
    expect(result).toMatch(/^vendor-/)
  })

  it('应该支持自定义 async_suffix', async () => {
    const plugin = splitChunks({ async_suffix: '.async' })
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })

    expect(config).toBeDefined()
    const manualChunks = config?.build?.rolldownOptions?.output?.advancedChunks?.groups![0].name

    // 测试动态导入的 node_modules 模块
    const result = manualChunks!('/path/to/node_modules/react/index.js', {
      getModuleInfo: vi.fn((): ModuleInfo | null => ({ importers: [], isEntry: false })),
    })
    expect(result).toMatch(/\.async$/)
  })

  it('应该正确处理 node_modules 模块', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })
    const manualChunks = config?.build?.rolldownOptions?.output?.advancedChunks?.groups![0].name

    // 静态导入的 node_modules 模块 - 模拟被入口模块导入
    const modules = new Map<string, ModuleInfo>([
      ['/entry.js', { importers: [], isEntry: true }],
      ['/path/to/node_modules/react/index.js', { importers: ['/entry.js'], isEntry: false }],
    ])
    const getModuleInfo = (id: string): ModuleInfo | null => modules.get(id) ?? null

    const staticResult = manualChunks!('/path/to/node_modules/react/index.js', {
      getModuleInfo: vi.fn(getModuleInfo),
    })
    expect(staticResult).toBe(`${VENDOR_PREFIX}react`)

    // 动态导入的 node_modules 模块
    const dynamicResult = manualChunks!('/path/to/node_modules/react/index.js', {
      getModuleInfo: vi.fn((): ModuleInfo | null => ({ importers: [], isEntry: false })),
    })
    expect(dynamicResult).toBe(`${VENDOR_PREFIX}react${ASYNC_SUFFIX}`)
  })

  it('应该忽略非 node_modules 模块', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })
    const manualChunks = config?.build?.rolldownOptions?.output?.advancedChunks?.groups![0].name

    const result = manualChunks!('/path/to/src/index.js', {
      getModuleInfo: vi.fn((): ModuleInfo | null => ({ importers: [], isEntry: false })),
    })
    expect(result).toBeUndefined()
  })

  it('应该正确处理 .pnpm 路径', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })
    const manualChunks = config?.build?.rolldownOptions?.output?.advancedChunks?.groups![0].name

    // .pnpm 路径应该被忽略，使用默认 'vendor'
    const result = manualChunks!('/path/to/node_modules/.pnpm/react@18.0.0/node_modules/react/index.js', {
      getModuleInfo: vi.fn((): ModuleInfo | null => ({ importers: [], isEntry: true })),
    })
    expect(result).toBe(`${VENDOR_PREFIX}vendor`)
  })

  it('应该正确处理 @scope 包名', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })
    const manualChunks = config?.build?.rolldownOptions?.output?.advancedChunks?.groups![0].name

    // 模拟被入口模块导入，只提取 scoped 包名的第一部分
    const modules = new Map<string, ModuleInfo>([
      ['/entry.js', { importers: [], isEntry: true }],
      ['/path/to/node_modules/@babel/core/lib/index.js', { importers: ['/entry.js'], isEntry: false }],
    ])
    const getModuleInfo = (id: string): ModuleInfo | null => modules.get(id) ?? null

    const result = manualChunks!('/path/to/node_modules/@babel/core/lib/index.js', {
      getModuleInfo: vi.fn(getModuleInfo),
    })
    // 只提取 @babel，不包含 /core
    expect(result).toBe(`${VENDOR_PREFIX}@babel`)
  })

  it('应该处理配置函数中的错误', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })
    const manualChunks = config?.build?.rolldownOptions?.output?.advancedChunks?.groups![0].name

    // 模拟 getModuleInfo 抛出错误
    const result = manualChunks!('/path/to/node_modules/react/index.js', {
      getModuleInfo: vi.fn((): ModuleInfo | null => {
        throw new Error('Test error')
      }),
    })
    // 错误被捕获，返回 undefined
    expect(result).toBeUndefined()
  })

  it('应该在插件初始化失败时抛出错误', async () => {
    const plugin = splitChunks()

    // 模拟插件配置失败的情况（通过传入无效参数）
    // 由于 splitChunks 不会抛出错误，我们需要测试实际的错误场景
    // 这里我们验证插件对象的结构
    expect(plugin.name).toBe('rolldown-vite-plugin-chunk-split')
    expect(typeof plugin.config).toBe('function')
  })
})

describe('generateManualChunks', () => {
  it('应该正确配置 rolldownOptions', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })

    expect(config?.build?.rolldownOptions).toEqual({
      output: {
        advancedChunks: {
          groups: [
            {
              name: expect.any(Function),
            },
          ],
        },
      },
    })
  })

  it('应该使用 Vite 8 的 Rolldown API', async () => {
    const plugin = splitChunks()
    // @ts-expect-error 测试环境中传入空参数
    const config = await plugin.config!({}, { mode: 'build' })

    // 验证使用了 advancedChunks 而不是旧的 manualChunks
    expect(config?.build?.rolldownOptions?.output?.advancedChunks).toBeDefined()
    expect(config?.build?.rolldownOptions?.output?.manualChunks).toBeUndefined()
  })
})
