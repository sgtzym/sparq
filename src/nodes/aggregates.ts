import { type ArrayLike, castArray } from '~/core/utils.ts'
import type { Node, NodeContext } from '~/core/node.ts'
import { SetQuantifierNode } from '~/nodes/modifiers.ts'

export enum AggregateFunction {
    Avg = 'AVG',
    Count = 'COUNT',
    Max = 'MAX',
    Min = 'MIN',
    Sum = 'SUM',
}

export class AggregateNode implements Node {
    constructor(
        private readonly fn: AggregateFunction,
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: NodeContext): string {
        let quantifier: SetQuantifierNode | undefined
        const fields: Node[] = []

        for (const node of castArray(this.nodes)) {
            if (node instanceof SetQuantifierNode) {
                quantifier = node
            } else {
                fields.push(node)
            }
        }

        return `${this.fn}(${
            [
                quantifier?.interpret(ctx),
                fields.map((n) => n.interpret(ctx)).join(', '),
            ].filter(Boolean).join(' ')
        })`
    }
}
