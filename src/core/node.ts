import type { Context } from '@/core/context.ts'

export interface Node {
    interpret(ctx: Context): string
}
