import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export class AliasNode implements Node {
    constructor(
        private readonly name: Node,
        private readonly asName: Node,
    ) {}

    interpret(ctx: Context): string {
        return `${this.name.interpret(ctx)} AS ${this.asName.interpret(ctx)}`
    }
}
