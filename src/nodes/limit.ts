import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export class LimitNode implements Node {
    constructor(
        private readonly count: Node,
        private readonly offset?: Node,
    ) {}

    interpret(ctx: Context): string {
        return [
            `LIMIT ${this.count.interpret(ctx)}`,
            this.offset?.interpret(ctx),
        ].filter(Boolean).join(' ')
    }
}

export class OffsetNode implements Node {
    constructor(
        private readonly count: Node,
    ) {}

    interpret(ctx: Context): string {
        return `OFFSET ${this.count.interpret(ctx)}`
    }
}
