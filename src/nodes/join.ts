import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export enum JoinType {
    Inner = 'INNER',
    Left = 'LEFT',
    Cross = 'CROSS',
}

export class JoinNode implements Node {
    constructor(private readonly joinType: JoinType) {}

    interpret(ctx: Context): string {
        return `JOIN`
    }
}
