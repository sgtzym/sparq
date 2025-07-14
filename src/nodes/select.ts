import type { Node, Context } from '../core/node.ts'

export class SelectNode implements Node {
    constructor(
        private nodes: Node[],
    ) {}

    interpret(ctx: Context): string {
        return `SELECT ${this.nodes.map((n) => n.interpret(ctx)).join(', ')}`
    }
}
