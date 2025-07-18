import { type ArrayLike, castArray } from '@/core/utils.ts'
import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export class FromNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: Context): string {
        return `FROM ${castArray(this.nodes)[0].interpret(ctx)}`
    }
}
