import type { SqlDataType, SqlString } from '~/core/sql.ts'
import { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import {
    from,
    groupBy,
    having,
    joinCross,
    joinInner,
    joinLeft,
    joinLeftOuter,
    limit,
    offset,
    onConflictAbort,
    onConflictFail,
    onConflictIgnore,
    onConflictNothing,
    onConflictReplace,
    onConflictRollback,
    onConflictUpdate,
    orderBy,
    returning,
    set,
    values,
    where,
} from '~/nodes/clauses.ts'
import { cte, with_ } from '~/nodes/ctes.ts'
import { _delete, _insert, _select, _update } from '~/nodes/statements.ts'
import { AssignmentNode, valueList } from '~/nodes/values.ts'
import { Sparq } from '~/api/sparq.ts'

// ---------------------------------------------
// Clause implementations
// ---------------------------------------------

/**
 * Creates an INNER JOIN clause to combine tables.
 */
const joinImpl = function <T extends SqlQueryBuilder>(
    this: T,
    table: SqlNodeValue,
): {
    /**
     * Creates an `INNER JOIN` clause to combine tables on matching rows.
     * Use this to get only rows that have matches in both tables.
     */
    inner: (condition?: SqlNodeValue) => T

    /**
     * Creates a `LEFT JOIN` clause to include all rows from the left table.
     * Use this to get all rows from the first table, with matching rows from the second.
     */
    left: (condition?: SqlNodeValue) => T

    /**
     * Creates a `LEFT OUTER JOIN` clause.
     * Alternative syntax for `LEFT JOIN` operations.
     */
    leftOuter: (condition?: SqlNodeValue) => T

    /**
     * Creates a `CROSS JOIN` clause for Cartesian product of tables.
     * Use this to get all possible combinations of rows from both tables.
     */
    cross: () => T
} {
    const _table: SqlNodeValue = table instanceof Sparq ? table.table : table

    return {
        inner: (condition?: SqlNodeValue): T =>
            this.add(joinInner(_table, condition)),
        left: (condition?: SqlNodeValue): T =>
            this.add(joinLeft(_table, condition)),
        leftOuter: (condition?: SqlNodeValue): T =>
            this.add(joinLeftOuter(_table, condition)),
        cross: (): T => this.add(joinCross(_table)),
    }
}

/**
 * Creates a WHERE clause for filtering rows based on conditions.
 * Use this to specify which rows should be included in your results.
 */
const whereImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...conditions: SqlNodeValue[]
): T {
    return this.add(where(...conditions))
}

/**
 * Creates a GROUP BY clause for aggregating results by columns.
 * Use this to group rows together for aggregate calculations.
 */
const groupByImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: SqlNodeValue[]
): T {
    return this.add(groupBy(...columns))
}

/**
 * Creates a HAVING clause for filtering grouped results.
 * Use this to filter groups after aggregation (like WHERE for groups).
 */
const havingImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...conditions: SqlNodeValue[]
): T {
    return this.add(having(...conditions))
}

/**
 * Creates an ORDER BY clause for sorting query results.
 * Use this to control the order in which rows are returned.
 */
const orderByImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: SqlNodeValue[]
): T {
    return this.add(orderBy(...columns))
}

/**
 * Creates a LIMIT clause for restricting the number of results.
 * Use this to control how many rows are returned.
 */
const limitImpl = function <T extends SqlQueryBuilder>(
    this: T,
    count: SqlNodeValue,
): T {
    return this.add(limit(count))
}

/**
 * Creates an OFFSET clause for skipping rows in pagination.
 * Use this with LIMIT to implement pagination functionality.
 */
const offsetImpl = function <T extends SqlQueryBuilder>(
    this: T,
    count: SqlNodeValue,
): T {
    return this.add(offset(count))
}

/**
 * Creates a RETURNING clause to get data from affected rows.
 * Use this to retrieve information about rows that were inserted, updated, or deleted.
 *
 * @param columns - The columns to return (defaults to * if empty)
 */
const returningImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: SqlNodeValue[]
): T {
    return this.add(returning(...columns))
}

/**
 * Creates an `ON CONFLICT` clause.
 * Use this to resolve occuring conflicts while inserting/updating data.
 */
const conflictImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...targets: SqlNodeValue[]
): {
    /**
     * Creates an ON CONFLICT DO ABORT clause.
     * Use this to abort the transaction when a conflict occurs.
     */
    abort: () => T

    /**
     * Creates an ON CONFLICT DO FAIL clause.
     * Use this to fail the current statement when a conflict occurs.
     */
    fail: () => T

    /**
     * Creates an ON CONFLICT DO IGNORE clause.
     * Use this to silently ignore conflicts and continue.
     */
    ignore: () => T

    /**
     * Creates an ON CONFLICT DO REPLACE clause.
     * Use this to replace the entire row when a conflict occurs.
     */
    replace: () => T

    /**
     * Creates an ON CONFLICT DO ROLLBACK clause.
     * Use this to rollback the transaction when a conflict occurs.
     */
    rollback: () => T

    /**
     * Creates an ON CONFLICT DO NOTHING clause.
     * Use this to skip the conflicting row and continue with other operations.
     */
    nothing: () => T

    /**
     * Creates an ON CONFLICT DO UPDATE clause for upsert operations.
     * Use this to update existing rows when conflicts occur during insert.
     */
    upsert: (assignments: SqlNodeValue[], ...conditions: SqlNodeValue[]) => T
} {
    return {
        abort: (): T => this.add(onConflictAbort(...targets)),
        fail: (): T => this.add(onConflictFail(...targets)),
        ignore: (): T => this.add(onConflictIgnore(...targets)),
        replace: (): T => this.add(onConflictReplace(...targets)),
        rollback: (): T => this.add(onConflictRollback(...targets)),
        nothing: (): T => this.add(onConflictNothing(...targets)),
        upsert: (
            assignments: SqlNodeValue[],
            ...conditions: SqlNodeValue[]
        ): T =>
            this.add(
                onConflictUpdate(assignments, targets, conditions),
            ),
    }
}

// ---------------------------------------------
// Base query builder
// ---------------------------------------------

/**
 * Base class for all SQL query builders.
 * Provides common functionality for building and executing SQL queries.
 */
export abstract class SqlQueryBuilder extends SqlNode {
    protected _parts: SqlNode[] = []
    protected _params?: ParameterReg
    protected _cache?: { sql: string; params: readonly SqlDataType[] }

    constructor() {
        super()
    }

    render(): SqlString {
        this._params = new ParameterReg()
        const sql: SqlString = renderSqlNodes(this._parts, this._params, true)
            .join(' ')
        this._cache = { sql, params: this._params.toArray() }
        return sql
    }

    /**
     * Adds a SQL clause or node to the query.
     */
    protected add(part: SqlNode): this {
        this._parts.push(part)
        this._cache = undefined
        return this
    }

    /**
     * Gets the generated SQL string ready for execution.
     *
     * @example
     * ```ts
     * // "SELECT * FROM users WHERE users.active = :p1"
     * users.select().where(user.active.eq(true)).sql
     * ```
     */
    get sql(): SqlString {
        return this._cache ? this._cache.sql : this.render()
    }

    /**
     * Gets the parameter values for the query in order.
     *
     * @example
     * ```ts
     * // [true]
     * users.select().where(user.active.eq(true)).params
     * ```
     */
    get params(): readonly SqlDataType[] {
        if (!this._cache) this.render()
        return this._cache!.params
    }

    /**
     * Creates a WITH clause containing one or more CTEs.
     * Allows you to define temporary result sets at the beginning of your query.
     */
    with(name: string, query: Select, recursive?: boolean): this {
        return this.add(with_(recursive, cte(name, query._parts)))
    }

    // Implements common clauses
    where = whereImpl
    orderBy = orderByImpl
    limit = limitImpl
    offset = offsetImpl
}

// ---------------------------------------------
// Top-level builders
// ---------------------------------------------

export class Select extends SqlQueryBuilder {
    constructor(
        private readonly table: string,
        private readonly columns?: SqlNodeValue[],
    ) {
        super()

        this.add(_select(this.columns))
        this.add(from(this.table))
    }

    join = joinImpl
    groupBy = groupByImpl
    having = havingImpl

    /**
     * Override render to add parentheses when used as a subquery.
     * This is detected by checking if a ParameterReg is passed in.
     */
    override render(params?: ParameterReg): SqlString {
        return params
            ? `(${renderSqlNodes(this._parts, params).join(' ')})`
            : super.render()
    }
}

export class Insert extends SqlQueryBuilder {
    private readonly _values = values()

    constructor(
        private readonly table: string,
        private readonly columns: SqlNodeValue[],
    ) {
        super()
        this.add(_insert(this.table, this.columns))
        this.add(this._values)
    }

    /**
     * Creates a VALUES clause for specifying explicit row data.
     * Use this to define the actual data for INSERT operations.
     */
    values(...args: SqlNodeValue[]): this {
        if (args.length !== this.columns.length) {
            throw new Error(
                `Insert requires ${this.columns.length} values. Received ${args.length}.`,
            )
        }

        this._values.addRow(valueList(...args))

        return this
    }

    conflict = conflictImpl
    returning = returningImpl
}

export class Update extends SqlQueryBuilder {
    private readonly assignments: SqlNode[] = []

    constructor(
        private readonly table: string,
        assignments: SqlNodeValue[],
    ) {
        super()

        this.add(_update(this.table))

        for (const assign of assignments) {
            if (assign instanceof AssignmentNode) {
                this.assignments.push(assign)
            }
        }

        this.add(set(...this.assignments))
    }

    conflict = conflictImpl
    returning = returningImpl
}

export class Delete extends SqlQueryBuilder {
    constructor(private readonly table: string) {
        super()
        this.add(_delete())
        this.add(from(this.table))
    }

    returning = returningImpl
}
