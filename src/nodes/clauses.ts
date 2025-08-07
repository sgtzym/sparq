import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    type ParameterReg,
    renderAll,
    toNode,
} from '~/core/node.ts'
import { id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Clauses
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a FROM clause with table references.
 */
export class FromNode implements Node {
    readonly priority: number = 10

    constructor(private readonly tables: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const tables: string = renderAll(this.tables, params).join(', ')

        return `${sql('FROM')} ${tables}`
    }
}

/**
 * Represents a JOIN clause with optional conditions.
 */
export class JoinNode implements Node {
    readonly priority: number = 20

    constructor(
        private readonly joinType: Node,
        private readonly table: Node,
        private readonly condition?: Node,
    ) {}

    render(params: ParameterReg): SqlString {
        const type: string = this.joinType.render(params)
        const table: string = this.table.render(params)
        const condition: string = this.condition?.render(params)

        return condition
            ? `${type} ${sql('JOIN')} ${table} ${sql('ON')} ${condition}`
            : `${type} ${sql('JOIN')} ${table}`
    }
}

/**
 * Represents a WHERE clause for filtering rows.
 */
export class WhereNode implements Node {
    readonly priority: number = 30

    constructor(private readonly conditions: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const conditions: string = renderAll(this.conditions, params).join(
            ` ${sql('AND')} `,
        )

        return `${sql('WHERE')} ${conditions}`
    }
}

/**
 * Represents a GROUP BY clause for result aggregation.
 */
export class GroupByNode implements Node {
    readonly priority: number = 40

    constructor(private readonly expr: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const expr: string = renderAll(this.expr, params).join(', ')

        return `${sql('GROUP')} ${sql('BY')} ${expr}`
    }
}

/**
 * Represents a HAVING clause for filtering grouped results.
 */
export class HavingNode implements Node {
    readonly priority: number = 50

    constructor(private readonly conditions: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const conditions: string = renderAll(this.conditions, params).join(
            ` ${sql('AND')} `,
        )

        return `${sql('HAVING')} ${conditions}`
    }
}

/**
 * Represents an ORDER BY clause for sorting results.
 */
export class OrderByNode implements Node {
    readonly priority: number = 60

    constructor(private readonly expr: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const expr: string = renderAll(this.expr, params).join(', ')

        return `${sql('ORDER')} ${sql('BY')} ${expr}`
    }
}

/**
 * Represents a LIMIT clause for restricting result count.
 */
export class LimitNode implements Node {
    readonly priority: number = 70

    constructor(private readonly count: Node) {}

    render(params: ParameterReg): SqlString {
        const count: string = this.count.render(params)

        return `${sql('LIMIT')} ${count}`
    }
}

/**
 * Represents an OFFSET clause for result pagination.
 */
export class OffsetNode implements Node {
    readonly priority: number = 80

    constructor(private readonly count: Node) {}

    render(params: ParameterReg): SqlString {
        const count: string = this.count.render(params)

        return `${sql('OFFSET')} ${count}`
    }
}

/**
 * Represents a RETURNING clause for getting affected row data.
 */
export class ReturningNode implements Node {
    readonly priority = 90

    constructor(private readonly columns: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const cols = renderAll(this.columns, params).join(', ')
        return `${sql('RETURNING')} ${cols}`
    }
}

/**
 * Represents a VALUES clause for explicit row data.
 */
export class ValuesNode implements Node {
    constructor(private readonly rows: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const rows: string = renderAll(this.rows, params).join(', ')

        return `${sql('VALUES')} ${rows};`
    }
}

/**
 * Represents a SET clause for UPDATE operations.
 */
export class SetNode implements Node {
    readonly priority: number = 5

    constructor(private readonly assignments: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const assignments: string = renderAll(this.assignments, params).join(
            ', ',
        )

        return `${sql('SET')} ${assignments};`
    }
}

// -> 🏭 Factories

/**
 * Creates a FROM clause with table references.
 * @param tables The tables to select from
 * @returns A FROM node
 */
export const from = (...tables: NodeArg[]) =>
    new FromNode(
        tables.map((table) =>
            typeof table === 'string' ? id(table) : toNode(table)
        ),
    )

/**
 * Creates a JOIN clause factory.
 * @param type The join type string
 * @returns A function that creates join nodes
 */
const join = (type: string) => (table: NodeArg, condition?: NodeArg): Node =>
    new JoinNode(
        raw(type),
        toNode(table),
        condition ? toNode(condition) : undefined,
    )

/**
 * Creates an INNER JOIN clause.
 * @param table The table to join
 * @param condition The optional join condition
 * @returns A join node
 */
export const joinInner = join(sql('INNER'))

/**
 * Creates a LEFT JOIN clause.
 * @param table The table to join
 * @param condition The optional join condition
 * @returns A join node
 */
export const joinLeft = join(sql('LEFT'))

/**
 * Creates a LEFT OUTER JOIN clause.
 * @param table The table to join
 * @param condition The optional join condition
 * @returns A join node
 */
export const joinLeftOuter = join(`${sql('LEFT')} ${sql('OUTER')}`)

/**
 * Creates a CROSS JOIN clause.
 * @param table The table to join
 * @returns A join node
 */
export const joinCross = (table: NodeArg) =>
    new JoinNode(
        raw(sql('CROSS')),
        typeof table === 'string' ? id(table) : toNode(table),
    )

/**
 * Creates a WHERE clause with filter conditions.
 * @param conditions The conditions to filter by
 * @returns A WHERE node
 */
export const where = (...conditions: NodeArg[]) =>
    new WhereNode(conditions.map(toNode))

/**
 * Creates a GROUP BY clause for result aggregation.
 * @param columns The columns to group by
 * @returns A GROUP BY node
 */
export const groupBy = (...columns: NodeArg[]) =>
    new GroupByNode(
        columns.map((col) => (typeof col === 'string' ? id(col) : toNode(col))),
    )

/**
 * Creates a HAVING clause for filtering grouped results.
 * @param conditions The conditions to filter grouped results by
 * @returns A HAVING node
 */
export const having = (...conditions: NodeArg[]) =>
    new HavingNode(conditions.map(toNode))

/**
 * Creates an ORDER BY clause for sorting results.
 * @param columns The columns to sort by
 * @returns An ORDER BY node
 */
export const orderBy = (...columns: NodeArg[]) =>
    new OrderByNode(
        columns.map((col) => (typeof col === 'string' ? id(col) : toNode(col))),
    )

/**
 * Creates a LIMIT clause for restricting result count.
 * @param count The maximum number of results
 * @returns A LIMIT node
 */
export const limit = (count: NodeArg) => new LimitNode(toNode(count))

/**
 * Creates an OFFSET clause for result pagination.
 * @param count The number of results to skip
 * @returns An OFFSET node
 */
export const offset = (count: NodeArg) => new OffsetNode(toNode(count))

/**
 * Creates a RETURNING clause for getting affected row data.
 * @param columns The columns to return
 * @returns A RETURNING node
 */
export const returning = (...columns: NodeArg[]) =>
    new ReturningNode(columns.map(toNode))

/**
 * Creates a VALUES clause for explicit row data.
 * @param rows The rows of data
 * @returns A VALUES node
 */
export const values = (...rows: NodeArg[]) => new ValuesNode(rows.map(toNode))

/**
 * Creates a SET clause for UPDATE operations.
 * @param assignments The column assignments
 * @returns A SET node
 */
export const set = (...assignments: NodeArg[]) =>
    new SetNode(assignments.map(toNode))
