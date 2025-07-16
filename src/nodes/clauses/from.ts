import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'
import { type ArrayLike, castArray } from '@/core/utils.ts'
import { JoinNode } from '../join.ts'

export class FromNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        const tables: Node[] = []
        const joins: Node[] =[]

        for (const node of castArray(this.nodes)) {
            const name: string = node.constructor.name

            if (name === JoinNode.name) {
                joins.push(node) // TODO
            } else {
                tables.push(node)
            }
        }

        return [
            `FROM ${tables[0].interpret(ctx)}`,
            joins.map((join) => join.interpret(ctx)).join(' ')
        ].filter(Boolean).join(' ')
    }
}
