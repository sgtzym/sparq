import type { SqlDataType, SqlString } from '~/core/sql.ts'

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
import { _delete, _insert, _select, _update } from '~/nodes/statements.ts'
import { cte, with_ } from '~/nodes/ctes.ts'
import { AssignmentNode, valueList } from '~/nodes/values.ts'
import { Sparq } from '~/api/sparq.ts'
import {
    renderSqlNodes,
    sortSqlNodes,
    SqlNode,
    SqlNodeValue,
} from '../core/sql-node.ts'
import { ParameterReg } from '../core/param-registry.ts'

// ---------------------------------------------
// Clause implementations
// ---------------------------------------------

const joinImpl = function <T extends SqlQueryBuilder>(
    this: T,
    table: SqlNodeValue,
): {
    inner: (condition?: SqlNodeValue) => T
    left: (condition?: SqlNodeValue) => T
    leftOuter: (condition?: SqlNodeValue) => T
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

const whereImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...conditions: SqlNodeValue[]
): T {
    return this.add(where(...conditions))
}

const groupByImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: SqlNodeValue[]
): T {
    return this.add(groupBy(...columns))
}

const havingImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...conditions: SqlNodeValue[]
): T {
    return this.add(having(...conditions))
}

const orderByImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: SqlNodeValue[]
): T {
    return this.add(orderBy(...columns))
}

const limitImpl = function <T extends SqlQueryBuilder>(
    this: T,
    count: SqlNodeValue,
): T {
    return this.add(limit(count))
}
const offsetImpl = function <T extends SqlQueryBuilder>(
    this: T,
    count: SqlNodeValue,
): T {
    return this.add(offset(count))
}

const returningImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: SqlNodeValue[]
): T {
    return this.add(returning(...columns))
}

const conflictImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...targets: SqlNodeValue[]
): {
    abort: () => T
    fail: () => T
    ignore: () => T
    replace: () => T
    rollback: () => T
    nothing: () => T
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

export abstract class SqlQueryBuilder extends SqlNode {
    protected _parts: SqlNode[] = []
    protected _params?: ParameterReg
    private _cache?: { sql: string; params: readonly SqlDataType[] }

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

    protected add(part: SqlNode): this {
        this._parts.push(part)
        this._cache = undefined
        return this
    }

    get sql(): SqlString {
        return this._cache ? this._cache.sql : this.render()
    }

    get params(): readonly SqlDataType[] {
        if (!this._cache) this.render()
        return this._cache!.params
    }

    /**
     * Adds a common table expression. (prefixs statements)
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
