import { IndexedStorage } from './utils.ts'

export type NodeContext<T = unknown> = IndexedStorage<T>

export const ctx: () => NodeContext = () => new IndexedStorage()

export interface Node {
    interpret(ctx: NodeContext): string
}
