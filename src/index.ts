/*
 * @Author: yanghongxuan
 * @Date: 2025-04-23 15:00:35
 * @Description:
 * @LastEditTime: 2025-04-25 14:00:38
 * @LastEditors: yanghongxuan
 */
import type { Plugin } from 'rolldown-vite'

import { init } from 'es-module-lexer'
import path from 'node:path'

import { staticImportedScan } from './staticImportScan'
import { nodeName, normalizePath } from './utils'

export default (
): Plugin => {
  return {
    name: 'rolldown-vite-plugin-chunk-split',
    async config() {
      await init
      return {
        build: {
          rollupOptions: {
            output: {
              advancedChunks: {
                groups: [
                  {
                    name: (id, { getModuleInfo }) => {
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
                  }
                ]
              },
            },
          },
        },
      }
    },
  }
}
