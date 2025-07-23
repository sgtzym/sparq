import { type ArrayLike, castArray } from '~/core/utils.ts'
import type { Node, NodeContext } from '~/core/node.ts'
import { SetQuantifierNode } from '~/nodes/modifiers.ts'

class SelectNode implements Node {
    constructor(
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

        return [
            'SELECT',
            quantifier?.interpret(ctx),
            fields.map((node) => node.interpret(ctx)).join(', '),
        ].filter(Boolean).join(' ')
    }
}

class UpdateNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx?: NodeContext): string {
        const nodes: Node[] = castArray(this.nodes)
        const table: string = nodes[nodes.length - 1].interpret(ctx)

        return `UPDATE ${table} SET`
    }
}

export { SelectNode, UpdateNode }
