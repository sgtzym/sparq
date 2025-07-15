import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'
import { type ArrayLike, castArray } from '@/core/utils.ts'
import { DistinctNode } from '@/nodes/modifiers/distinct.ts'

export enum AggregateFunction {
    $avg = 'AVG',
    $count = 'COUNT',
    $max = 'MAX',
    $min = 'MIN',
    $sum = 'SUM',
}

export class AggregateNode implements Node {
    constructor(
        private readonly fn: AggregateFunction,
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        const modifiers: Map<string, Node> = new Map()
        const fields: Node[] = []

        for (const node of castArray(this.nodes)) {
            const name: string = node.constructor.name

            if (name === DistinctNode.name) {
                modifiers.set(name, node)
            } else {
                fields.push(node)
            }
        }

        return `${this.fn}(${
            [
                modifiers.get(DistinctNode.name)?.interpret(ctx) ?? '',
                fields[0].interpret(ctx),
            ].filter(Boolean).join(' ')
        })`
    }
}
