import type { Node, NodeContext } from '../core/node.ts'

export class WhereNode implements Node {
    constructor(
        private nodes: Node[],
    ) {}

    interpret(ctx: NodeContext): string {
        return `WHERE ${this.nodes.map((n) => n.interpret(ctx)).join(` AND `)}`
    }
}
