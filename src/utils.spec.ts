import { describe, expect, it } from 'vitest'

import { nodeName } from './utils'

describe('nodeName', () => {
  it('应该从 node_modules 路径中提取包名', () => {
    expect(nodeName('/path/to/node_modules/react/index.js')).toBe('react')
    expect(nodeName('/path/to/node_modules/vue/dist/vue.js')).toBe('vue')
    expect(nodeName('/path/to/node_modules/lodash-es/lodash.js')).toBe('lodash-es')
  })

  it('应该只提取 scoped 包名的第一部分', () => {
    expect(nodeName('/path/to/node_modules/@babel/core/lib/index.js')).toBe('@babel')
    expect(nodeName('/path/to/node_modules/@types/node/index.d.ts')).toBe('@types')
  })

  it('应该忽略 .pnpm 路径', () => {
    expect(nodeName('/path/to/node_modules/.pnpm/vue-demi@0.14.10_vue@3.5.26_typescript@5.9.3_/node_modules/vue/index.mjs')).toBeUndefined()
    expect(nodeName('/path/to/node_modules/.pnpm/registry.npmjs.org+react@18.0.0/node_modules/react/index.js')).toBeUndefined()
  })

  it('对于非 node_modules 路径应该返回 undefined', () => {
    expect(nodeName('/path/to/src/index.js')).toBeUndefined()
    expect(nodeName('/path/to/dist/bundle.js')).toBeUndefined()
  })

  it('应该处理边界情况', () => {
    expect(nodeName('')).toBeUndefined()
    expect(nodeName('node_modules')).toBeUndefined()
    expect(nodeName('/path/to/node_modules/')).toBeUndefined()
  })
})
