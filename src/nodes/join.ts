import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export enum JoinType {
    Inner = 'INNER',
    Left = 'LEFT',
    LeftOuter = 'LEFT OUTER',
    Cross = 'CROSS',
}

export class JoinNode implements Node {
    constructor(
        private readonly joinType: JoinType,
        private table: Node,
        private condition?: Node,
    ) {}

    interpret(ctx: Context): string {
        return [
            `${this.joinType} JOIN`,
            this.table.interpret(ctx),
            this.condition ? `ON ${this.condition.interpret(ctx)}` : undefined,
        ].filter(Boolean).join(' ')
    }
}
