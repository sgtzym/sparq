import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export class TopNode implements Node {
    constructor(
        private readonly count: number,
    ) {}

    interpret(_ctx: Context): string {
        return `TOP ${this.count}`
    }
}
