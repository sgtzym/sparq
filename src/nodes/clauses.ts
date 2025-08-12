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
        const _tables: SqlString = renderAll(this.tables, params).join(', ')

        return sql('FROM', _tables)
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
        const _type: SqlString = this.joinType.render(params)
        const _table: SqlString = this.table.render(params)
        const _condition: SqlString | undefined = this.condition?.render(params)

        return _condition
            ? sql(_type, 'JOIN', _table, 'ON', _condition)
            : sql(_type, 'JOIN', _table)
    }
}

/**
 * Represents a WHERE clause for filtering rows.
 */
export class WhereNode implements Node {
    readonly priority: number = 30

    constructor(private readonly conditions: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const _conditions: SqlString = renderAll(this.conditions, params).join(
            ` ${sql('AND')} `,
        )

        return sql('WHERE', _conditions)
    }
}

/**
 * Represents a GROUP BY clause for result aggregation.
 */
export class GroupByNode implements Node {
    readonly priority: number = 40

    constructor(private readonly expr: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderAll(this.expr, params).join(', ')

        return sql('GROUP BY', _expr)
    }
}

/**
 * Represents a HAVING clause for filtering grouped results.
 */
export class HavingNode implements Node {
    readonly priority: number = 50

    constructor(private readonly conditions: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const _conditions: SqlString = renderAll(this.conditions, params).join(
            ` ${sql('AND')} `,
        )

        return sql('HAVING', _conditions)
    }
}

/**
 * Represents an ORDER BY clause for sorting results.
 */
export class OrderByNode implements Node {
    readonly priority: number = 60

    constructor(private readonly expr: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderAll(this.expr, params).join(', ')

        return sql('ORDER BY', _expr)
    }
}

/**
 * Represents a LIMIT clause for restricting result count.
 */
export class LimitNode implements Node {
    readonly priority: number = 70

    constructor(private readonly count: Node) {}

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('LIMIT', _count)
    }
}

/**
 * Represents an OFFSET clause for result pagination.
 */
export class OffsetNode implements Node {
    readonly priority: number = 80

    constructor(private readonly count: Node) {}

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('OFFSET', _count)
    }
}

/**
 * Represents a RETURNING clause for getting affected row data.
 */
export class ReturningNode implements Node {
    readonly priority = 90

    constructor(private readonly columns?: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const _columns: SqlString = this.columns
            ? renderAll(this.columns, params).join(', ')
            : '*'
        return `${sql('RETURNING', _columns)};`
    }
}

/**
 * Represents a VALUES clause for explicit row data.
 */
export class ValuesNode implements Node {
    private rows: Node[] = []

    addRow(valueList: Node): void {
        this.rows.push(valueList)
    }

    render(params: ParameterReg): SqlString {
        const _rows: SqlString = renderAll(this.rows, params).join(', ')

        return sql('VALUES', _rows)
    }
}

/**
 * Represents a SET clause for UPDATE operations.
 */
export class SetNode implements Node {
    readonly priority: number = 5

    constructor(private readonly assignments: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const _assignments: SqlString = renderAll(this.assignments, params)
            .join(', ')

        return sql('SET', _assignments)
    }
}

/**
 * Represents a ON CONFLICT clause for INSERT / UPDATE statements.
 */
export class OnConflictNode implements Node {
    constructor(
        private readonly action: Node,
        private readonly targets?: ArrayLike<Node>,
    ) {}

    render(params: ParameterReg): SqlString {
        const _action: SqlString = this.action.render(params)

        const _targets: SqlString | undefined = this.targets
            ? renderAll(this.targets, params).join(', ')
            : undefined

        return sql(
            'ON CONFLICT',
            _targets ? `(${_targets})` : '',
            '\nDO',
            _action,
        )
    }
}

/**
 * Represents an UPSERT clause for INSERT / UPDATE statements.
 */
export class UpsertNode implements Node {
    constructor(
        private readonly assignments: ArrayLike<Node>,
        private readonly targets?: ArrayLike<Node>,
        private readonly conditions?: ArrayLike<Node>,
    ) {}

    render(params: ParameterReg): SqlString {
        const _assignments: SqlString = renderAll(this.assignments, params)
            .join(', ')

        const _targets: SqlString | undefined = this.targets
            ? renderAll(this.targets, params).join(', ')
            : undefined

        const _conditions: SqlString | undefined = this.conditions
            ? renderAll(this.conditions, params).join(` ${sql('AND')} `)
            : undefined

        return sql(
            'ON CONFLICT',
            _targets ? `(${_targets})` : '',
            '\nDO UPDATE SET',
            _assignments,
            _conditions ? `\nWHERE ${_conditions}` : '',
        )
    }
}

// -> 🏭 Factories

/**
 * Creates a FROM clause with table references.
 * @param tables - The tables to select from
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
 * @param type - The join type string
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
 * @param table - The table to join
 * @param condition The optional join condition
 * @returns A join node
 */
export const joinInner = join(sql('INNER'))

/**
 * Creates a LEFT JOIN clause.
 * @param table - The table to join
 * @param condition - The optional join condition
 * @returns A join node
 */
export const joinLeft = join(sql('LEFT'))

/**
 * Creates a LEFT OUTER JOIN clause.
 * @param table - The table to join
 * @param condition - The optional join condition
 * @returns A join node
 */
export const joinLeftOuter = join(sql('LEFT OUTER'))

/**
 * Creates a CROSS JOIN clause.
 * @param table - The table to join
 * @returns A join node
 */
export const joinCross = (table: NodeArg) =>
    new JoinNode(
        raw(sql('CROSS')),
        typeof table === 'string' ? id(table) : toNode(table),
    )

/**
 * Creates a WHERE clause with filter conditions.
 * @param conditions - The conditions to filter by
 * @returns A WHERE node
 */
export const where = (...conditions: NodeArg[]) =>
    new WhereNode(conditions.map(toNode))

/**
 * Creates a GROUP BY clause for result aggregation.
 * @param columns - The columns to group by
 * @returns A GROUP BY node
 */
export const groupBy = (...columns: NodeArg[]) =>
    new GroupByNode(
        columns.map((col) => (typeof col === 'string' ? id(col) : toNode(col))),
    )

/**
 * Creates a HAVING clause for filtering grouped results.
 * @param conditions - The conditions to filter grouped results by
 * @returns A HAVING node
 */
export const having = (...conditions: NodeArg[]) =>
    new HavingNode(conditions.map(toNode))

/**
 * Creates an ORDER BY clause for sorting results.
 * @param columns - The columns to sort by
 * @returns An ORDER BY node
 */
export const orderBy = (...columns: NodeArg[]) =>
    new OrderByNode(
        columns.map((col) => (typeof col === 'string' ? id(col) : toNode(col))),
    )

/**
 * Creates a LIMIT clause for restricting result count.
 * @param count - The maximum number of results
 * @returns A LIMIT node
 */
export const limit = (count: NodeArg) => new LimitNode(toNode(count))

/**
 * Creates an OFFSET clause for result pagination.
 * @param count - The number of results to skip
 * @returns An OFFSET node
 */
export const offset = (count: NodeArg) => new OffsetNode(toNode(count))

/**
 * Creates a RETURNING clause for getting affected row data.
 * @param columns - The columns to return
 * @returns A RETURNING node
 */
export const returning = (...columns: NodeArg[]) =>
    new ReturningNode(columns.map(toNode))

/**
 * Creates a VALUES clause for explicit row data.
 * @param rows - The rows of data
 * @returns A VALUES node
 */
export const values = () => new ValuesNode()

/**
 * Creates a SET clause for UPDATE statements.
 * @param assignments - The column assignments
 * @returns A SET node
 */
export const set = (...assignments: NodeArg[]) =>
    new SetNode(assignments.map(toNode))

/**
 * Creates a ON CONFLICT clause factory.
 * @param action - The action to resolve the conflict
 * @param target - The conflict target (columns)
 * @returns A function that creates join nodes
 */
const conflict = (action: string) => (...targets: NodeArg[]) =>
    new OnConflictNode(
        raw(action),
        targets.map((t) => typeof t === 'string' ? id(t) : toNode(t)),
    )

/**
 * Creates a ON CONFLICT clause for DO ABORT resolution.
 */
export const onConflictAbort = conflict(sql('ABORT'))

/**
 * Creates a ON CONFLICT clause for DO FAIL resolution.
 */
export const onConflictFail = conflict(sql('FAIL'))

/**
 * Creates a ON CONFLICT clause for DO IGNORE resolution.
 */
export const onConflictIgnore = conflict(sql('IGNORE'))

/**
 * Creates a ON CONFLICT clause for DO REPLACE resolution.
 */
export const onConflictReplace = conflict(sql('REPLACE'))

/**
 * Creates a ON CONFLICT clause for DO ROLLBACK resolution.
 */
export const onConflictRollback = conflict(sql('ROLLBACK'))

/**
 * Creates a ON CONFLICT clause for DO NOTHING resolution.
 */
export const onConflictNothing = conflict(sql('NOTHING'))

/**
 * Creates a ON CONFLICT clause for UPSERT resolution.
 */
export const onConflictUpdate = (
    assignments: NodeArg[],
    targets?: NodeArg[],
    conditions?: NodeArg[],
) => {
    const _targets: Node[] | undefined = targets?.map(toNode) ?? undefined
    const _conditions: Node[] | undefined = conditions?.map(toNode) ?? undefined

    return new UpsertNode(
        assignments.map(toNode),
        _targets,
        _conditions,
    )
}
