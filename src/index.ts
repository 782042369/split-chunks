import type { ChunkingContext } from 'rolldown-vite/types/internal/rollupTypeCompat'
import type { Plugin } from 'vite'

import { init } from 'es-module-lexer'
import assert from 'node:assert'
import path from 'node:path'

import { staticImportedScan } from './staticImportScan'
import { nodeName, normalizePath } from './utils'

type NullValue<T = void> = T | undefined | null | void;

type ManualChunksOption = (id: string, context: ChunkingContext) => string | NullValue
function wrapCustomSplitConfig(manualChunks: ManualChunksOption) {
  assert(typeof manualChunks === 'function')
  return (
    moduleId: string,
    { getModuleInfo }: ChunkingContext,
  ) => {
    return manualChunks(moduleId, { getModuleInfo })
  }
}

const cwd = process.cwd()
function generateManualChunks() {
  return wrapCustomSplitConfig(
    (id: string, { getModuleInfo }: ChunkingContext): string | NullValue => {
      if (id.includes('node_modules')) {
        if (staticImportedScan(id, getModuleInfo, new Map(), [])) {
          return `p-${nodeName(id) ?? 'vender'
            }`
        }
        else {
          return `p-${nodeName(id) ?? 'vender'
            }-async`
        }
      }
      if (!id.includes('node_modules')) {
        const extname = path.extname(id)
        return normalizePath(path.relative(cwd, id).replace(extname, ''))
      }
    },
  )
}

export const splitChunks = (
): Plugin => {
  return {
    name: 'vite-plugin-chunk-split',
    async config() {
      await init
      const manualChunks = generateManualChunks()
      return {
        build: {
          rollupOptions: {
            output: {
              // TODO: 配置项 暂时先用 manualChunks
              manualChunks: manualChunks,
              // advancedChunks: {
              //   groups: [
              //     {
              //       name: wrapCustomSplitConfig,
              //     },
              //   ],
              // },
            },
          },
        },
      }
    },
  }
}
