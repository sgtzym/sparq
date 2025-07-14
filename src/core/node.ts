import type { Context } from './context.ts'

export interface Node {
    interpret(ctx: Context): string
}
