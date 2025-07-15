import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'
import { type ArrayLike, castArray } from '@/core/utils.ts'
import { DistinctNode } from '@/nodes/modifiers/distinct.ts'
import { TopNode } from '@/nodes/modifiers/top.ts'

export class SelectNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        const modifiers: Map<string, Node> = new Map()
        const fields: Node[] = []

        for (const node of castArray(this.nodes)) {
            const name: string = node.constructor.name

            if (name === DistinctNode.name || name === TopNode.name) {
                modifiers.set(name, node)
            } else {
                fields.push(node)
            }
        }

        return [
            'SELECT',
            modifiers.get(DistinctNode.name)?.interpret(ctx) ?? '',
            modifiers.get(TopNode.name)?.interpret(ctx) ?? '',
            fields.map((n) => n.interpret(ctx)).join(', '),
        ].filter(Boolean).join(' ')
    }
}
