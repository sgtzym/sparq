import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Clauses
// ---------------------------------------------

// -> 🔷 Nodes

export class FromNode extends SqlNode {
    override readonly _priority: number = 1

    constructor(private readonly tables: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _tables: SqlString = renderSqlNodes(this.tables, params).join(
            ', ',
        )

        return sql('FROM', _tables)
    }
}

export class JoinNode extends SqlNode {
    override readonly _priority: number = 2

    constructor(
        private readonly joinType: SqlNode,
        private readonly table: SqlNode,
        private readonly condition?: SqlNode,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _type: SqlString = this.joinType.render(params)
        const _table: SqlString = this.table.render(params)
        const _condition: SqlString | undefined = this.condition?.render(params)

        return _condition
            ? sql(_type, 'JOIN', _table, 'ON', _condition)
            : sql(_type, 'JOIN', _table)
    }
}

export class SetNode extends SqlNode {
    override readonly _priority: number = 2

    constructor(private readonly assignments: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _assignments: SqlString = renderSqlNodes(this.assignments, params)
            .join(', ')

        return sql('SET', _assignments)
    }
}

export class WhereNode extends SqlNode {
    override readonly _priority: number = 3

    constructor(private readonly conditions: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _conditions: SqlString = renderSqlNodes(this.conditions, params)
            .join(
                ` ${sql('AND')} `,
            )

        return sql('WHERE', _conditions)
    }
}

export class GroupByNode extends SqlNode {
    override readonly _priority: number = 4

    constructor(private readonly expr: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderSqlNodes(this.expr, params).join(', ')

        return sql('GROUP BY', _expr)
    }
}

export class HavingNode extends SqlNode {
    override readonly _priority: number = 5

    constructor(private readonly conditions: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _conditions: SqlString = renderSqlNodes(this.conditions, params)
            .join(
                ` ${sql('AND')} `,
            )

        return sql('HAVING', _conditions)
    }
}

export class OrderByNode extends SqlNode {
    override readonly _priority: number = 6

    constructor(private readonly expr: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderSqlNodes(this.expr, params).join(', ')

        return sql('ORDER BY', _expr)
    }
}

export class LimitNode extends SqlNode {
    override readonly _priority: number = 7

    constructor(private readonly count: SqlNode) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('LIMIT', _count)
    }
}

export class OffsetNode extends SqlNode {
    override readonly _priority: number = 8

    constructor(private readonly count: SqlNode) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('OFFSET', _count)
    }
}

export class ValuesNode extends SqlNode {
    override readonly _priority = 9

    private rows: SqlNode[] = []

    constructor() {
        super()
    }

    /**
     * Adds a row of values to the VALUES clause.
     * Call this multiple times to insert multiple rows at once.
     *
     * @param valueList - A value list node containing the row data
     */
    addRow(valueList: SqlNode): void {
        this.rows.push(valueList)
    }

    render(params: ParameterReg): SqlString {
        const _rows: SqlString = renderSqlNodes(this.rows, params).join(', ')

        return sql('VALUES', _rows)
    }
}

export class ReturningNode extends SqlNode {
    override readonly _priority = 10

    constructor(private readonly columns?: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _columns: SqlString = this.columns
            ? renderSqlNodes(this.columns, params).join(', ')
            : '*'
        return `${sql('RETURNING', _columns)};`
    }
}

export class OnConflictNode extends SqlNode {
    override _priority: number = 11

    constructor(
        private readonly action: SqlNode,
        private readonly targets?: ArrayLike<SqlNode>,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _action: SqlString = this.action.render(params)

        const _targets: SqlString | undefined = this.targets
            ? renderSqlNodes(this.targets, params).join(', ')
            : undefined

        return sql(
            'ON CONFLICT',
            _targets ? `(${_targets})` : '',
            'DO',
            _action,
        )
    }
}

export class UpsertNode extends SqlNode {
    override _priority: number = 11

    constructor(
        private readonly assignments: ArrayLike<SqlNode>,
        private readonly targets?: ArrayLike<SqlNode>,
        private readonly conditions?: ArrayLike<SqlNode>,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _assignments: SqlString = renderSqlNodes(this.assignments, params)
            .join(', ')

        const _targets: SqlString | undefined = this.targets
            ? renderSqlNodes(this.targets, params).join(', ')
            : undefined

        const _conditions: SqlString | undefined = this.conditions
            ? renderSqlNodes(this.conditions, params).join(` ${sql('AND')} `)
            : undefined

        return sql(
            'ON CONFLICT',
            _targets ? `(${_targets})` : '',
            'DO UPDATE SET',
            _assignments,
            _conditions ? `WHERE ${_conditions}` : '',
        )
    }
}

// -> 🏭 Factories

/** Specifies source tables. */
export const from = (...tables: SqlNodeValue[]) => new FromNode(tables.map(id))

const join =
    (type: string) =>
    (table: SqlNodeValue, condition?: SqlNodeValue): SqlNode =>
        new JoinNode(
            raw(type),
            id(table),
            condition ? expr(condition) : undefined,
        )

/** Joins tables with matching rows. */
export const joinInner = join(sql('INNER'))

/** Joins tables keeping all left rows. */
export const joinLeft = join(sql('LEFT'))

/** Joins tables keeping all left rows (outer). */
export const joinLeftOuter = join(sql('LEFT OUTER'))

/** Creates Cartesian product of tables. */
export const joinCross = (table: SqlNodeValue) =>
    new JoinNode(raw(sql('CROSS')), id(table))

/** Filters rows by conditions. */
export const where = (...conditions: SqlNodeValue[]) =>
    new WhereNode(conditions.map(expr))

/** Groups rows for aggregation. */
export const groupBy = (...columns: SqlNodeValue[]) =>
    new GroupByNode(columns.map(id))

/** Filters grouped results. */
export const having = (...conditions: SqlNodeValue[]) =>
    new HavingNode(conditions.map(expr))

/** Sorts query results. */
export const orderBy = (...columns: SqlNodeValue[]) =>
    new OrderByNode(columns.map(id))

/** Limits result count. */
export const limit = (count: SqlNodeValue) => new LimitNode(expr(count))

/** Skips initial rows. */
export const offset = (count: SqlNodeValue) => new OffsetNode(expr(count))

/** Returns data from affected rows. */
export const returning = (...columns: SqlNodeValue[]) =>
    new ReturningNode(
        columns && columns.length > 0 ? columns.map(id) : raw('*'),
    )

/**
 * Specifies row data for inserts.
 * Add multiple rows by calling addRow() on the returned node.
 *
 * @example
 * ```ts
 * // VALUES ('John', 25), ('Jane', 30)
 * const _values = values()
 * _values.addRow(valueList('John', 25))
 * _values.addRow(valueList('Jane', 30))
 * ```
 */
export const values = () => new ValuesNode()

/**
 * Assigns column values for updates.
 * Specify which columns to change and their new values.
 *
 * @example
 * ```ts
 * // SET product.price = product.price * 1.1
 * set(product.price.to(product.price.mul(1.1)))
 *
 * // SET user.name = 'John', user.age = 25
 * set(user.name.to('John'), user.age.to(25))
 * ```
 */
export const set = (...assignments: SqlNodeValue[]) =>
    new SetNode(assignments.map(expr))

const conflict = (action: string) => (...targets: SqlNodeValue[]) =>
    new OnConflictNode(raw(action), targets.map(id))

/** Aborts on conflict. */
export const onConflictAbort = conflict(sql('ABORT'))

/** Fails on conflict. */
export const onConflictFail = conflict(sql('FAIL'))

/** Ignores conflicts. */
export const onConflictIgnore = conflict(sql('IGNORE'))

/** Replaces on conflict. */
export const onConflictReplace = conflict(sql('REPLACE'))

/** Rolls back on conflict. */
export const onConflictRollback = conflict(sql('ROLLBACK'))

/** Does nothing on conflict. */
export const onConflictNothing = conflict(sql('NOTHING'))

/**
 * Updates existing rows on conflict (upsert).
 *
 * @param assignments - Column assignments for the update
 * @param targets - Conflict target columns
 * @param conditions - Optional WHERE conditions
 */
export const onConflictUpdate = (
    assignments: SqlNodeValue[],
    targets?: SqlNodeValue[],
    conditions?: SqlNodeValue[],
) => {
    const _targets: SqlNode[] | undefined = targets?.map(id) ?? undefined
    const _conditions: SqlNode[] | undefined = conditions?.map(expr) ??
        undefined

    return new UpsertNode(
        assignments.map(expr),
        _targets,
        _conditions,
    )
}
