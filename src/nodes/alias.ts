import type { Node, NodeContext } from '~/core/node.ts'

export class AliasNode implements Node {
    constructor(
        private readonly name: Node,
        private readonly asName: Node,
    ) {}

    interpret(ctx: NodeContext): string {
        return `${this.name.interpret(ctx)} AS ${this.asName.interpret(ctx)}`
    }
}
