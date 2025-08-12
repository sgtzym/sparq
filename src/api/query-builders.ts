import type { SqlParam, SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    type NodeConvertible,
    ParameterReg,
    renderAll,
    renderAST,
} from '~/core/node.ts'
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

// ---------------------------------------------
// Clause implementations
// ---------------------------------------------

const joinImpl = function <T extends SqlQueryBuilder>(
    this: T,
    table: NodeArg,
): {
    inner: (condition?: NodeArg) => T
    left: (condition?: NodeArg) => T
    leftOuter: (condition?: NodeArg) => T
    cross: () => T
} {
    return {
        inner: (condition?: NodeArg): T =>
            this.add(joinInner(table, condition)),
        left: (condition?: NodeArg): T => this.add(joinLeft(table, condition)),
        leftOuter: (condition?: NodeArg): T =>
            this.add(joinLeftOuter(table, condition)),
        cross: (): T => this.add(joinCross(table)),
    }
}

const whereImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...conditions: NodeArg[]
): T {
    return this.add(where(...conditions))
}

const groupByImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: NodeArg[]
): T {
    return this.add(groupBy(...columns))
}

const havingImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...conditions: NodeArg[]
): T {
    return this.add(having(...conditions))
}

const orderByImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: NodeArg[]
): T {
    return this.add(orderBy(...columns))
}

const limitImpl = function <T extends SqlQueryBuilder>(
    this: T,
    count: NodeArg,
): T {
    return this.add(limit(count))
}
const offsetImpl = function <T extends SqlQueryBuilder>(
    this: T,
    count: NodeArg,
): T {
    return this.add(offset(count))
}

const returningImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...columns: NodeArg[]
): T {
    return this.add(returning(...columns))
}

const conflictImpl = function <T extends SqlQueryBuilder>(
    this: T,
    ...targets: NodeArg[]
): {
    abort: () => T
    fail: () => T
    ignore: () => T
    replace: () => T
    rollback: () => T
    nothing: () => T
    upsert: (assignments: NodeArg[], ...conditions: NodeArg[]) => T
} {
    return {
        abort: (): T => this.add(onConflictAbort(...targets)),
        fail: (): T => this.add(onConflictFail(...targets)),
        ignore: (): T => this.add(onConflictIgnore(...targets)),
        replace: (): T => this.add(onConflictReplace(...targets)),
        rollback: (): T => this.add(onConflictRollback(...targets)),
        nothing: (): T => this.add(onConflictNothing(...targets)),
        upsert: (assignments: NodeArg[], ...conditions: NodeArg[]): T =>
            this.add(
                onConflictUpdate(assignments, targets, conditions),
            ),
    }
}

// ---------------------------------------------
// Base query builder
// ---------------------------------------------

export abstract class SqlQueryBuilder {
    protected _parts: Node[] = []
    protected _params?: ParameterReg
    private _cache?: { sql: string; params: readonly SqlParam[] }

    get sql(): SqlString {
        if (!this._cache) this._render()
        return this._cache!.sql
    }

    get params(): readonly SqlParam[] {
        if (!this._cache) this._render()
        return this._cache!.params
    }

    private _render(): void {
        this._params = new ParameterReg()
        const sql = renderAST(this._parts, this._params)
        this._cache = { sql, params: this._params.toArray() }
    }

    protected add(part: Node): this {
        this._parts.push(part)
        this._cache = undefined
        return this
    }

    /**
     * Adds a common table expression.
     */
    with(name: string, query: SelectBuilder, recursive?: boolean): this {
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

export class SelectBuilder extends SqlQueryBuilder implements NodeConvertible {
    constructor(
        private readonly table: string,
        private readonly columns?: NodeArg[],
    ) {
        super()

        this.add(_select(this.columns))
        this.add(from(this.table))
    }

    join = joinImpl
    groupBy = groupByImpl
    having = havingImpl

    // Supports subqueries based on context
    get node(): Node {
        return {
            render: (params: ParameterReg) =>
                `(${renderAll(this._parts, params).join(' ')})`,
        }
    }
}

export class Insert extends SqlQueryBuilder {
    private readonly _values = values()

    constructor(
        private readonly table: string,
        private readonly columns: NodeArg[],
    ) {
        super()
        this.add(_insert(this.table, this.columns))
        this.add(this._values)
    }

    values(...args: NodeArg[]): this {
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
    private readonly assignments: Node[] = []

    constructor(
        private readonly table: string,
        assignments: NodeArg[],
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
