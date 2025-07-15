import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'
import { type ArrayLike, castArray } from '../core/utils.ts'
import { IdentifierNode } from './primitives.ts'
import { DistinctModNode } from './modifiers/distinct.ts'
import { TopModNode } from './modifiers/top.ts'

export class SelectNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        const modifiers: Map<string, Node> = new Map()
        const columns: Node[] = []

        for (const node of castArray(this.nodes)) {
            const name: string = node.constructor.name
            if (name !== IdentifierNode.name) {
                modifiers.set(name, node)
            } else {
                columns.push(node)
            }
        }

        return [
            'SELECT',
            modifiers.get(DistinctModNode.name)?.interpret(ctx) ?? '',
            modifiers.get(TopModNode.name)?.interpret(ctx) ?? '',
            columns.map((n) => n.interpret(ctx)).join(', '),
        ].filter(Boolean).join(' ')
    }
}
