import type { Context } from '../core/context.ts'
import type { Node } from '../core/node.ts'

export enum SetQuantifierKeyword {
    Distinct = 'DISTINCT',
    All = 'ALL',
}

export class SetQuantifierNode implements Node {
    constructor(
        private readonly quantifier: SetQuantifierKeyword,
    ) {}

    interpret(_ctx: Context): string {
        return this.quantifier
    }
}

export enum SortingDirectionKeyword {
    Asc = 'ASC',
    Desc = 'DESC',
}

export class SortingDirectionNode implements Node {
    constructor(
        private readonly dir: SortingDirectionKeyword,
        private readonly node: Node,
    ) {}

    interpret(ctx: Context): string {
        return `${this.node.interpret(ctx)} ${this.dir}`
    }
}
