import type { ChunkingContext } from 'rolldown-vite/types/internal/rollupTypeCompat'
import type { Plugin } from 'vite'

import { init } from 'es-module-lexer'
import assert from 'node:assert'
import { createLogger } from 'vite'

import { ASYNC_SUFFIX, NODE_MODULES, VENDOR_PREFIX } from './constants'
import { staticImportedScan } from './staticImportScan'
import { nodeName } from './utils'

// 常量定义

const logger = createLogger()

// 类型定义提取
type Nullable<T = void> = T | undefined | null | void
type ManualChunksOption = (id: string, context: ChunkingContext) => Nullable<string>
interface Options {
  /**  chunk prefix default : p-  */
  vendor_prefix?: string
  /**  async chunk suffix default : -async  */
  async_suffix?: string
}
/**
 * 包装自定义分割配置函数，增加类型安全
 */
function wrapCustomSplitConfig(manualChunks: ManualChunksOption): ManualChunksOption {
  assert(typeof manualChunks === 'function', 'manualChunks must be a function')
  return (moduleId: string, { getModuleInfo }: ChunkingContext) => {
    try {
      return manualChunks(moduleId, { getModuleInfo })
    }
    catch (error: any) {
      logger?.error(`Error in manualChunks for ${moduleId}:`, error)
      return undefined
    }
  }
}

/**
 * 生成手动分块策略
 */
function generateManualChunks(options?: Options): ManualChunksOption {
  return wrapCustomSplitConfig(
    (id: string, { getModuleInfo }: ChunkingContext): Nullable<string> => {
      // 缓存路径分析结果
      const isNodeModule = id.includes(NODE_MODULES)
      const name = nodeName(id) ?? 'vendor'

      if (isNodeModule) {
        // 静态导入的node_modules模块
        const isStaticImport = staticImportedScan(
          id,
          getModuleInfo,
          new Map(),
          [],
        )
        return `${options?.vendor_prefix || VENDOR_PREFIX}${name}${isStaticImport ? '' : options?.async_suffix || ASYNC_SUFFIX}`
      }
      if (id.includes('vite')) {
        return `${options?.vendor_prefix || VENDOR_PREFIX}vite`
      }
    },
  )
}

export function splitChunks(options?: Options): Plugin {
  return {
    name: 'rolldown-vite-plugin-chunk-split',
    async config() {
      try {
        await init
        const manualChunks = generateManualChunks(options)

        return {
          build: {
            rollupOptions: {
              output: {
                advancedChunks: {
                  groups: [{
                    name(moduleId, ctx) {
                      return manualChunks(moduleId, {
                        getModuleInfo: id => ctx.getModuleInfo(id),
                      })
                    },
                  }],
                },
              },
            },
          },
        }
      }
      catch (error: any) {
        logger?.error('Failed to initialize splitChunks plugin:', error)
        throw error
      }
    },
  }
}
