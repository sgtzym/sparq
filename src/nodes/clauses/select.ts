import { type ArrayLike, castArray } from '@/core/utils.ts'
import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'
import { SetQuantifierNode } from '@/nodes/modifiers.ts'

export class SelectNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        let quantifier: SetQuantifierNode | undefined
        const fields: Node[] = []

        for (const node of castArray(this.nodes)) {
            if (node instanceof SetQuantifierNode) {
                quantifier = node
            } else {
                fields.push(node)
            }
        }

        return [
            'SELECT',
            quantifier?.interpret(ctx),
            fields.map((n) => n.interpret(ctx)).join(', '),
        ].filter(Boolean).join(' ')
    }
}
