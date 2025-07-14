import { IndexedStorage } from './utils.ts'
export type Context<T = unknown> = IndexedStorage<T>
export const ctx: () => Context = () => new IndexedStorage()