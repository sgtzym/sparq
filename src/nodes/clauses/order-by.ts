import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'
import { type ArrayLike, castArray } from '../../core/utils.ts'

export class OrderByNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        return `ORDER BY ${
            castArray(this.nodes).map((n) => n.interpret(ctx)).join(', ')
        }`
    }
}
