import type { ChunkingContext } from 'rolldown-vite/types/internal/rollupTypeCompat'
import type { Plugin } from 'vite'

import { init } from 'es-module-lexer'
import path from 'node:path'

import { staticImportedScan } from './staticImportScan'
import { nodeName, normalizePath } from './utils'

function wrapCustomSplitConfig(id: string, { getModuleInfo }: ChunkingContext) {
  const cwd = process.cwd()
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
}
export function splitChunk(): Plugin {
  return {
    name: 'rolldown-vite-plugin-chunk-split',
    async config() {
      await init
      return {
        build: {
          rollupOptions: {
            output: {
              // TODO: 配置项 暂时先用 manualChunks
              manualChunks: wrapCustomSplitConfig,
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
