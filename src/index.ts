import type { Plugin } from 'vite'

import type { ChunkingContext } from './type'
import assert from 'node:assert'

import { createLogger } from 'vite'

import { ASYNC_SUFFIX, MIN_SIZE, NODE_MODULES_RE, VENDOR_PREFIX } from './constants'
import { staticImportedScan } from './staticImportScan.js'
import { nodeName } from './utils'

// 常量定义

const logger = createLogger()

// 类型定义提取
type Nullable<T = void> = T | undefined | null | void
type ManualChunksOption = (id: string, context: ChunkingContext) => Nullable<string>
export interface SplitChunksOptions {
  /** chunk 前缀，默认：p- */
  vendor_prefix?: string
  /** 异步 chunk 后缀，默认不追加，保证同一个包只有一个默认 chunk 名。 */
  async_suffix?: string
  /** 每个包独立成 chunk 的最小体积，默认：20 KiB；设为 0 可强制每个包尽量独立。 */
  min_size?: number
  /** 是否递归吸收命中包的依赖，默认关闭以尽量保持按包名拆分。 */
  include_dependencies_recursively?: boolean
  /** 关闭递归吸收依赖时是否保持严格执行顺序，默认开启。 */
  strict_execution_order?: boolean
}

interface NormalizedOptions {
  /** 最终写入 chunk 名的包前缀。 */
  vendorPrefix: string
  /** 异步 chunk 的额外后缀；为空时同一包复用同一个 chunk 名。 */
  asyncSuffix: string
  /** 独立包 chunk 的最小体积阈值，小于该值时交给 Rolldown 自动分包。 */
  minSize: number
  /** 是否让命中组递归吸收依赖；关闭时更接近“每个包按包名独立构建”。 */
  includeDependenciesRecursively: boolean
  /** 是否要求 Rolldown 保持严格执行顺序，主要用于关闭递归吸收依赖后的安全边界。 */
  strictExecutionOrder: boolean
}

function resolveOptions(options: SplitChunksOptions = {}): NormalizedOptions {
  const includeDependenciesRecursively = options.include_dependencies_recursively ?? false

  return {
    vendorPrefix: options.vendor_prefix ?? VENDOR_PREFIX,
    asyncSuffix: options.async_suffix ?? ASYNC_SUFFIX,
    minSize: options.min_size ?? MIN_SIZE,
    includeDependenciesRecursively,
    strictExecutionOrder: options.strict_execution_order ?? !includeDependenciesRecursively,
  }
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
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      logger?.error(`Error in manualChunks for ${moduleId}: ${message}`)
      return undefined
    }
  }
}

/**
 * 生成手动分块策略
 */
function generateManualChunks(options: NormalizedOptions): ManualChunksOption {
  const staticImportCache = new Map<string, boolean>()

  return wrapCustomSplitConfig(
    (id: string, { getModuleInfo }: ChunkingContext): Nullable<string> => {
      const name = nodeName(id) ?? 'vendor'

      if (!NODE_MODULES_RE.test(id)) {
        return undefined
      }

      if (!options.asyncSuffix) {
        return `${options.vendorPrefix}${name}`
      }

      const isStaticImport = staticImportedScan(
        id,
        getModuleInfo,
        staticImportCache,
        [],
      )
      return `${options.vendorPrefix}${name}${isStaticImport ? '' : options.asyncSuffix}`
    },
  )
}

export function splitChunks(options?: SplitChunksOptions): Plugin {
  return {
    name: 'rolldown-vite-plugin-chunk-split',
    apply: 'build',
    async config() {
      try {
        const resolvedOptions = resolveOptions(options)
        const manualChunks = generateManualChunks(resolvedOptions)

        return {
          build: {
            rolldownOptions: {
              ...(!resolvedOptions.includeDependenciesRecursively
                ? { preserveEntrySignatures: 'allow-extension' as const }
                : {}),
              output: {
                ...(resolvedOptions.strictExecutionOrder
                  ? { strictExecutionOrder: true }
                  : {}),
                codeSplitting: {
                  includeDependenciesRecursively: resolvedOptions.includeDependenciesRecursively,
                  groups: [{
                    test: NODE_MODULES_RE,
                    minSize: resolvedOptions.minSize,
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
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        logger?.error(`Failed to initialize splitChunks plugin: ${message}`)
        throw error
      }
    },
  }
}
