import { type ArrayLike, castArray } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import type { Node } from '~/core/node.ts'

export const JOIN_TYPES = {
    INNER: SQL.INNER,
    LEFT: SQL.LEFT,
    LEFT_OUTER: `${SQL.LEFT} ${SQL.OUTER}`,
    CROSS: SQL.CROSS,
} as const

export type JoinType = typeof JOIN_TYPES[keyof typeof JOIN_TYPES]

/** */
export class FromNode implements Node {
    constructor(
        private readonly expression: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const parts = castArray(this.expression).map((e) => e.interpret(params))

        return `${SQL.FROM} ${sql.comma(...parts)}`
    }
}

/** */
export class WhereNode implements Node {
    constructor(
        private readonly expression: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const parts = castArray(this.expression).map((e) => e.interpret(params))

        return `${SQL.WHERE} ${sql.and(...parts)}`
    }
}

/** */
export class GroupByNode implements Node {
    constructor(
        private readonly expression: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const parts = castArray(this.expression).map((e) => e.interpret(params))

        return `${SQL.GROUP} ${SQL.BY} ${sql.comma(...parts)}`
    }
}

/** */
export class HavingNode implements Node {
    constructor(
        private readonly expression: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const parts = castArray(this.expression).map((e) => e.interpret(params))

        return `${SQL.HAVING} ${sql.and(...parts)}`
    }
}

/** */
export class JoinNode implements Node {
    constructor(
        private readonly joinType: JoinType,
        private readonly table: Node,
        private readonly condition?: Node,
    ) {}

    interpret(params: Parameters): string {
        const parts: (string | undefined)[] = []
        parts.push(this.table.interpret(params))
        parts.push(this.condition?.interpret(params))

        return `${this.joinType} ${SQL.JOIN} ${parts.filter(Boolean).join(` ${SQL.ON} `)}`
    }
}

/** */
export class LimitNode implements Node {
    constructor(
        private readonly count: number,
    ) {}

    interpret(_params: Parameters): string {
        return `${SQL.LIMIT} ${this.count}`
    }
}

/** */
export class OffsetNode implements Node {
    constructor(
        private readonly count: number,
    ) {}

    interpret(_params: Parameters): string {
        return `${SQL.OFFSET} ${this.count}`
    }
}

/** */
export class OrderByNode implements Node {
    constructor(
        private readonly expression: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const parts = castArray(this.expression).map((e) => e.interpret(params))

        return `${SQL.ORDER} ${SQL.BY} ${sql.comma(...parts)}`
    }
}

/** */
export class SetNode implements Node {
    constructor(
        private readonly column: Node,
        private readonly value: Node,
    ) {}

    interpret(params: Parameters): string {
        return `${this.column.interpret(params)} ${SQL_SYMBOLS.EQ} ${this.value.interpret(params)}`
    }
}
