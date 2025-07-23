import { type ArrayLike, castArray } from '~/core/utils.ts'
import type { Node, NodeContext } from '~/core/node.ts'

class FromNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: NodeContext): string {
        return `FROM ${
            castArray(this.nodes).map((node) => node.interpret(ctx)).join(', ')
        }`
    }
}

class GroupByNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: NodeContext): string {
        return `GROUP BY ${
            castArray(this.nodes).map((node) => node.interpret(ctx)).join(', ')
        }`
    }
}

class HavingNode implements Node {
    constructor(
        private nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: NodeContext): string {
        return `HAVING ${
            castArray(this.nodes).map((node) => node.interpret(ctx)).join(
                ` AND `,
            )
        }`
    }
}

enum JoinType {
    Inner = 'INNER',
    Left = 'LEFT',
    LeftOuter = 'LEFT OUTER',
    Cross = 'CROSS',
}

class JoinNode implements Node {
    constructor(
        private readonly joinType: JoinType,
        private table: Node,
        private condition?: Node,
    ) {}

    interpret(ctx: NodeContext): string {
        return [
            `${this.joinType} JOIN`,
            this.table.interpret(ctx),
            this.condition ? `ON ${this.condition.interpret(ctx)}` : undefined,
        ].filter(Boolean).join(' ')
    }
}

class LimitNode implements Node {
    constructor(
        private readonly count: Node,
        private readonly offset?: Node,
    ) {}

    interpret(ctx: NodeContext): string {
        return [
            `LIMIT ${this.count.interpret(ctx)}`,
            this.offset?.interpret(ctx),
        ].filter(Boolean).join(' ')
    }
}

class OffsetNode implements Node {
    constructor(
        private readonly count: Node,
    ) {}

    interpret(ctx: NodeContext): string {
        return `OFFSET ${this.count.interpret(ctx)}`
    }
}

class OrderByNode implements Node {
    constructor(
        private readonly nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: NodeContext): string {
        return `ORDER BY ${
            castArray(this.nodes).map((node) => node.interpret(ctx)).join(', ')
        }`
    }
}

class WhereNode implements Node {
    constructor(
        private nodes: ArrayLike<Node>,
    ) {}

    interpret(ctx: NodeContext): string {
        return `WHERE ${
            castArray(this.nodes).map((node) => node.interpret(ctx)).join(
                ` AND `,
            )
        }`
    }
}

export {
    FromNode,
    GroupByNode,
    HavingNode,
    JoinNode,
    JoinType,
    LimitNode,
    OffsetNode,
    OrderByNode,
    WhereNode,
}
