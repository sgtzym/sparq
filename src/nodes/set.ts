import type { Node, NodeContext } from '~/core/node.ts'
import { ComparisonOperator } from './binary.ts'
import { type ArrayLike, castArray } from '../core/utils.ts'

export class SetNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: NodeContext): string {
        const [field, value] = castArray(this.nodes)

        return [
            field.interpret(ctx),
            ComparisonOperator.Eq,
            value.interpret(ctx),
        ].join(' ')
    }
}
