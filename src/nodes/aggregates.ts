import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export enum AggregateFunction {
    $count = 'COUNT',
    $sum = 'SUM',
}

export class AggregateNode implements Node {
    constructor(
        private readonly func: AggregateFunction,
        private readonly expr: Node,
    ) {}

    interpret(ctx: Context): string {
        return `${this.func}(${this.expr.interpret(ctx)})`
    }
}
