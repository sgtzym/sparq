import type { Context } from '../core/context.ts'
import type { Node } from '../core/node.ts'

export class WhereNode implements Node {
    constructor(
        private nodes: Node[],
    ) {}

    interpret(ctx: Context): string {
        return `WHERE ${this.nodes.map((n) => n.interpret(ctx)).join(` AND `)}`
    }
}
