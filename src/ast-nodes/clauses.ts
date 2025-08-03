import { type ArrayLike, castArray } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { ParameterRegistry } from '~/core/parameter-registry.ts'
import { interpretAll, type Node } from '~/core/node.ts'

/** 🧬 AST nodes: Clauses */

/**
 * 🧬...
 * @param {ArrayLike<Node>} expr
 */
export class FromNode implements Node {
    constructor(
        private readonly expr: ArrayLike<Node>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const parts = castArray(this.expr).map((e) => e.interpret(params))

        return `${SQL.FROM} ${sql.comma(...parts)}`
    }
}

/**
 * 🧬...
 * @param {Node} expr
 */
export class IntoNode implements Node {
    constructor(
        private readonly expr: Node,
    ) {}

    interpret(params: ParameterRegistry): string {
        return `${SQL.INTO} ${this.expr.interpret(params)}`
    }
}

/**
 * 🧬...
 * @param {ArrayLike<Node>} expr
 */
export class WhereNode implements Node {
    constructor(
        private readonly expr: ArrayLike<Node>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const parts = castArray(this.expr).map((e) => e.interpret(params))

        return `${SQL.WHERE} ${sql.and(...parts)}`
    }
}

/**
 * 🧬...
 * @param {ArrayLike<Node>} expr
 */
export class GroupByNode implements Node {
    constructor(
        private readonly expr: ArrayLike<Node>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const parts = castArray(this.expr).map((e) => e.interpret(params))

        return `${SQL.GROUP} ${SQL.BY} ${sql.comma(...parts)}`
    }
}

/**
 * 🧬...
 * @param {ArrayLike<Node>} expr
 */
export class HavingNode implements Node {
    constructor(
        private readonly expr: ArrayLike<Node>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const parts = castArray(this.expr).map((e) => e.interpret(params))

        return `${SQL.HAVING} ${sql.and(...parts)}`
    }
}

export const JOIN_TYPES = {
    INNER: SQL.INNER,
    LEFT: SQL.LEFT,
    LEFT_OUTER: `${SQL.LEFT} ${SQL.OUTER}`,
    CROSS: SQL.CROSS,
} as const

export type JoinType = typeof JOIN_TYPES[keyof typeof JOIN_TYPES]

/**
 * 🧬...
 * @param {JoinType} joinType
 * @param {Node} table
 * @param {Node} condition
 */
export class JoinNode implements Node {
    constructor(
        private readonly joinType: JoinType,
        private readonly table: Node,
        private readonly condition?: Node,
    ) {}

    interpret(params: ParameterRegistry): string {
        const parts: (string | undefined)[] = []
        parts.push(this.table.interpret(params))
        parts.push(this.condition?.interpret(params))

        return `${this.joinType} ${SQL.JOIN} ${
            parts.filter(Boolean).join(` ${SQL.ON} `)
        }`
    }
}

/**
 * 🧬...
 * @param {number} count
 */
export class LimitNode implements Node {
    constructor(
        private readonly count: number,
    ) {}

    interpret(_params: ParameterRegistry): string {
        return `${SQL.LIMIT} ${this.count}`
    }
}

/**
 * 🧬...
 * @param {number} count
 */
export class OffsetNode implements Node {
    constructor(
        private readonly count: number,
    ) {}

    interpret(_params: ParameterRegistry): string {
        return `${SQL.OFFSET} ${this.count}`
    }
}

/**
 * 🧬...
 * @param {ArrayLike<Node>} expr
 */
export class OrderByNode implements Node {
    constructor(
        private readonly expr: ArrayLike<Node>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const parts = castArray(this.expr).map((e) => e.interpret(params))

        return `${SQL.ORDER} ${SQL.BY} ${sql.comma(...parts)}`
    }
}

type Assignment = [Node, Node]

/**
 * 🧬...
 * @param {Array<Assignment>} assignments
 */
export class SetNode implements Node {
    constructor(
        private readonly assignments: Array<Assignment>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const assignments = this.assignments.map(([column, value]) =>
            `${column.interpret(params)} ${SQL_SYMBOLS.EQ} ${
                value.interpret(params)
            }`
        )

        return `${SQL.SET} ${sql.comma(...assignments)}`
    }
}

type Values = Node[]

/**
 * 🧬...
 * @param {ArrayLike<Values>} values
 */
export class ValuesNode implements Node {
    constructor(
        private readonly values: ArrayLike<Values>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const values: string[] = castArray(this.values).map((v) =>
            sql.group(sql.comma(...interpretAll(v, params)))
        )

        return `${SQL.VALUES} ${sql.comma(...values)}${SQL_SYMBOLS.SEMI}`
    }
}
