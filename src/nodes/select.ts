import type { Node, NodeContext } from '../core/node.ts'

export class SelectNode implements Node {
    constructor(
        private nodes: Node[],
    ) {}

    interpret(ctx: NodeContext): string {
        return `SELECT ${this.nodes.map((n) => n.interpret(ctx)).join(', ')}`
    }
}
