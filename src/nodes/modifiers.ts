import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export enum SetQuantifier {
    Distinct = 'DISTINCT',
    All = 'ALL',
}

export class SetQuantifierNode implements Node {
    constructor(
        private readonly quantifier: SetQuantifier,
    ) {}

    interpret(_ctx: Context): string {
        return this.quantifier
    }
}

export enum SortingDirection {
    Asc = 'ASC',
    Desc = 'DESC',
}

export class SortingDirectionNode implements Node {
    constructor(
        private readonly dir: SortingDirection,
        private readonly node: Node,
    ) {}

    interpret(ctx: Context): string {
        return `${this.node.interpret(ctx)} ${this.dir}`
    }
}
