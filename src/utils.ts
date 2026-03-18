const NODE_MODULES_REGEX = /\/node_modules\/(?<moduleName>[^/]*)\//

export function nodeName(name: string) {
  if (name.includes('/node_modules/.pnpm/'))
    return undefined

  return name.toString().match(NODE_MODULES_REGEX)?.groups?.moduleName
}
