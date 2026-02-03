import type { BuildEnvironmentOptions } from 'vite'

// 工具类型：排除undefined类型
type ExcludeUndefined<T> = T extends undefined ? never : T

// 工具类型：提取数组元素类型
type ArrayElement<T> = T extends Array<infer U> ? U : T

// 提取Rplldown输出选项类型
type RplldownOutputOptions = ExcludeUndefined<BuildEnvironmentOptions['rolldownOptions']>['output']
type OutputOptions = ExcludeUndefined<RplldownOutputOptions>

// 提取advancedChunks配置类型
type AdvancedChunksOptions = ArrayElement<OutputOptions>['advancedChunks']
type ChunksGroups = ArrayElement<ExcludeUndefined<AdvancedChunksOptions>>['groups']

// 定义ChunkingContext类型
export type ChunkingContext = Parameters<
  Exclude<ArrayElement<ExcludeUndefined<ChunksGroups>>['name'], string>
>[1]

// 定义 getModuleInfo 函数类型
export type GetModuleInfo = ChunkingContext['getModuleInfo']

// 定义 ModuleInfo 类型用于测试
export type ModuleInfo = Exclude<ReturnType<GetModuleInfo>, null>
