import type { Node, NodeContext } from '~/core/node.ts'

export enum ComparisonOperator {
    Eq = '=',
    Ne = '!=',
    Gt = '>',
    Ge = '>=',
    Lt = '<',
    Le = '<=',
    In = 'IN',
    Like = 'LIKE',
}

export class BinaryNode implements Node {
    constructor(
        private op: ComparisonOperator,
        private left: Node,
        private right: Node,
    ) {}

    interpret(ctx: NodeContext): string {
        return [
            this.left.interpret(ctx),
            this.op,
            this.right.interpret(ctx),
        ].join(' ')
    }
}
