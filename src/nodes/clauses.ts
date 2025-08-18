import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Clauses
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a FROM clause with table references.
 */
export class FromNode extends SqlNode {
    override readonly priority: number = 10

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

/**
 * Represents a JOIN clause with optional conditions.
 */
export class JoinNode extends SqlNode {
    override readonly priority: number = 20

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

/**
 * Represents a WHERE clause for filtering rows.
 */
export class WhereNode extends SqlNode {
    override readonly priority: number = 30

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

/**
 * Represents a GROUP BY clause for result aggregation.
 */
export class GroupByNode extends SqlNode {
    override readonly priority: number = 40

    constructor(private readonly expr: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderSqlNodes(this.expr, params).join(', ')

        return sql('GROUP BY', _expr)
    }
}

/**
 * Represents a HAVING clause for filtering grouped results.
 */
export class HavingNode extends SqlNode {
    override readonly priority: number = 50

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

/**
 * Represents an ORDER BY clause for sorting results.
 */
export class OrderByNode extends SqlNode {
    override readonly priority: number = 60

    constructor(private readonly expr: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderSqlNodes(this.expr, params).join(', ')

        return sql('ORDER BY', _expr)
    }
}

/**
 * Represents a LIMIT clause for restricting result count.
 */
export class LimitNode extends SqlNode {
    override readonly priority: number = 70

    constructor(private readonly count: SqlNode) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('LIMIT', _count)
    }
}

/**
 * Represents an OFFSET clause for result pagination.
 */
export class OffsetNode extends SqlNode {
    override readonly priority: number = 80

    constructor(private readonly count: SqlNode) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('OFFSET', _count)
    }
}

/**
 * Represents a RETURNING clause for getting affected row data.
 */
export class ReturningNode extends SqlNode {
    override readonly priority = 95

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

/**
 * Represents a VALUES clause for explicit row data.
 */
export class ValuesNode extends SqlNode {
    override readonly priority = 90
    private rows: SqlNode[] = []

    constructor() {
        super()
    }

    addRow(valueList: SqlNode): void {
        this.rows.push(valueList)
    }

    render(params: ParameterReg): SqlString {
        const _rows: SqlString = renderSqlNodes(this.rows, params).join(', ')

        return sql('VALUES', _rows)
    }
}

/**
 * Represents a SET clause for UPDATE operations.
 */
export class SetNode extends SqlNode {
    override readonly priority: number = 5

    constructor(private readonly assignments: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _assignments: SqlString = renderSqlNodes(this.assignments, params)
            .join(', ')

        return sql('SET', _assignments)
    }
}

/**
 * Represents a ON CONFLICT clause for INSERT / UPDATE statements.
 */
export class OnConflictNode extends SqlNode {
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

/**
 * Represents an UPSERT clause for INSERT / UPDATE statements.
 */
export class UpsertNode extends SqlNode {
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

/**
 * Creates a FROM clause with table references.
 * @param tables - The tables to select from
 * @returns A FROM SqlNode
 */
export const from = (...tables: SqlNodeValue[]) => new FromNode(tables.map(id))

/**
 * Creates a JOIN clause factory.
 * @param type - The join type string
 * @returns A function that creates join nodes
 */
const join =
    (type: string) =>
    (table: SqlNodeValue, condition?: SqlNodeValue): SqlNode =>
        new JoinNode(
            raw(type),
            id(table),
            condition ? expr(condition) : undefined,
        )

/**
 * Creates an INNER JOIN clause.
 * @param table - The table to join
 * @param condition The optional join condition
 * @returns A join SqlNode
 */
export const joinInner = join(sql('INNER'))

/**
 * Creates a LEFT JOIN clause.
 * @param table - The table to join
 * @param condition - The optional join condition
 * @returns A join SqlNode
 */
export const joinLeft = join(sql('LEFT'))

/**
 * Creates a LEFT OUTER JOIN clause.
 * @param table - The table to join
 * @param condition - The optional join condition
 * @returns A join SqlNode
 */
export const joinLeftOuter = join(sql('LEFT OUTER'))

/**
 * Creates a CROSS JOIN clause.
 * @param table - The table to join
 * @returns A join SqlNode
 */
export const joinCross = (table: SqlNodeValue) =>
    new JoinNode(raw(sql('CROSS')), id(table))

/**
 * Creates a WHERE clause with filter conditions.
 * @param conditions - The conditions to filter by
 * @returns A WHERE SqlNode
 */
export const where = (...conditions: SqlNodeValue[]) =>
    new WhereNode(conditions.map(expr))

/**
 * Creates a GROUP BY clause for result aggregation.
 * @param columns - The columns to group by
 * @returns A GROUP BY SqlNode
 */
export const groupBy = (...columns: SqlNodeValue[]) =>
    new GroupByNode(columns.map(id))

/**
 * Creates a HAVING clause for filtering grouped results.
 * @param conditions - The conditions to filter grouped results by
 * @returns A HAVING SqlNode
 */
export const having = (...conditions: SqlNodeValue[]) =>
    new HavingNode(conditions.map(expr))

/**
 * Creates an ORDER BY clause for sorting results.
 * @param columns - The columns to sort by
 * @returns An ORDER BY SqlNode
 */
export const orderBy = (...columns: SqlNodeValue[]) =>
    new OrderByNode(columns.map(id))

/**
 * Creates a LIMIT clause for restricting result count.
 * @param count - The maximum number of results
 * @returns A LIMIT SqlNode
 */
export const limit = (count: SqlNodeValue) => new LimitNode(expr(count))

/**
 * Creates an OFFSET clause for result pagination.
 * @param count - The number of results to skip
 * @returns An OFFSET SqlNode
 */
export const offset = (count: SqlNodeValue) => new OffsetNode(expr(count))

/**
 * Creates a RETURNING clause for getting affected row data.
 * @param columns - The columns to return
 * @returns A RETURNING SqlNode
 */
export const returning = (...columns: SqlNodeValue[]) =>
    new ReturningNode(
        columns && columns.length > 0 ? columns.map(id) : raw('*'),
    )

/**
 * Creates a VALUES clause for explicit row data.
 * @param rows - The rows of data
 * @returns A VALUES SqlNode
 */
export const values = () => new ValuesNode()

/**
 * Creates a SET clause for UPDATE statements.
 * @param assignments - The column assignments
 * @returns A SET SqlNode
 */
export const set = (...assignments: SqlNodeValue[]) =>
    new SetNode(assignments.map(expr))

/**
 * Creates a ON CONFLICT clause factory.
 * @param action - The action to resolve the conflict
 * @param target - The conflict target (columns)
 * @returns A function that creates join nodes
 */
const conflict = (action: string) => (...targets: SqlNodeValue[]) =>
    new OnConflictNode(raw(action), targets.map(id))

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
