import type { Context } from '@/core/context.ts'
import { type ArrayLike, castArray } from '@/core/utils.ts'
import type { Node } from '@/core/node.ts'

export class WhereNode implements Node {
    constructor(
        private nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        return `WHERE ${
            castArray(this.nodes).map((n) => n.interpret(ctx)).join(` AND `)
        }`
    }
}
