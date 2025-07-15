import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export enum LogicalOperator {
    And = 'AND',
    Or = 'OR',
    Not = 'NOT',
}

export class LogicalNode implements Node {
    constructor(
        private op: LogicalOperator,
        private nodes: Node[],
    ) {}

    interpret(ctx: Context): string {
        if (this.op === LogicalOperator.Not && this.nodes.length === 1) {
            return `NOT ${this.nodes[0].interpret(ctx)}`
        }

        return `(${
            this.nodes.map((n) => n.interpret(ctx)).join(` ${this.op} `)
        })`
    }
}
