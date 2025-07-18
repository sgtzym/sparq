import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

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
        private left: Node,
        private op: ComparisonOperator,
        private right: Node,
    ) {}

    interpret(ctx: Context): string {
        return [
            this.left.interpret(ctx),
            this.op,
            this.right.interpret(ctx),
        ].join(' ')
    }
}
