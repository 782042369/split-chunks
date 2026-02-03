export const nodeName = (name: string) => name.toString().match(/\/node_modules\/(?!.pnpm)(?<moduleName>[^/]*)\//)?.groups!.moduleName
