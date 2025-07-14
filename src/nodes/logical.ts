import type { Node, Context } from '../core/node.ts'

export enum LogicalOperator {
    $and = 'AND',
    $or = 'OR',
    $not = 'NOT',
}

export class LogicalNode implements Node {
    constructor(
        private op: LogicalOperator,
        private nodes: Node[],
    ) {}

    interpret(ctx: Context): string {
        if (this.op === LogicalOperator.$not && this.nodes.length === 1) {
            return `NOT ${this.nodes[0].interpret(ctx)}`
        }

        return `(${
            this.nodes.map((n) => n.interpret(ctx)).join(` ${this.op} `)
        })`
    }
}
