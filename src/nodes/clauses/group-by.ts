import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'
import { type ArrayLike, castArray } from '../../core/utils.ts'

export class GroupByNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        return `GROUP BY ${
            castArray(this.nodes).map((node) => node.interpret(ctx)).join(', ')
        }`
    }
}
