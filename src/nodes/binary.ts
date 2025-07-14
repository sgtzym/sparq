import type { Node, NodeContext } from '../core/node.ts'

export enum ComparisonOperator {
    $eq = '=',
    $ne = '!=',
    $gt = '>',
    $ge = '>=',
    $lt = '<',
    $le = '<=',
    $in = 'IN',
    $like = 'LIKE',
}

export class BinaryNode implements Node {
    constructor(
        private left: Node,
        private op: ComparisonOperator,
        private right: Node,
    ) {}

    interpret(ctx: NodeContext): string {
        return `${this.left.interpret(ctx)} ${this.op} ${
            this.right.interpret(ctx)
        }`
    }
}
