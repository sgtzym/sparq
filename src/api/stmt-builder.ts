import type { SqlParam, SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    ParameterReg,
    renderAST,
    toNode,
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
    orderBy,
    returning,
    set,
    values,
    where,
} from '~/nodes/clauses.ts'
import { delete_, insert, select, update } from '~/nodes/statements.ts'
import { AssignmentNode, valueList } from '~/nodes/values.ts'
import { Column } from '~/api/column.ts'

// ---------------------------------------------
// Base statement builder
// ---------------------------------------------

abstract class SqlStatementBuilder {
    protected _clauses: Node[]
    protected _sql: SqlString
    protected _params: ParameterReg

    constructor() {
        this._clauses = []
        this._sql = ''
        this._params = new ParameterReg()
    }

    protected render() {
        this._sql = renderAST(this._clauses, this._params)
    }

    get sql(): SqlString {
        this.render()
        return this._sql
    }

    get params(): readonly SqlParam[] {
        this.render()
        return this._params.toArray()
    }

    protected addClause(clause: Node): this {
        this._clauses.push(clause)
        this.render()
        return this
    }
}

// ---------------------------------------------
// Capability mixins
// ---------------------------------------------

interface Where {
    where(...conditions: NodeArg[]): this
}

interface OrderBy {
    orderBy(...columns: NodeArg[]): this
}

interface Limit {
    limit(count: NodeArg): this & Offset
}

interface Offset {
    offset(count: NodeArg): this
}

interface Join<T> {
    inner(table: NodeArg, condition?: NodeArg): T
    left(table: NodeArg, condition?: NodeArg): T
    leftOuter(table: NodeArg, condition?: NodeArg): T
    cross(table: NodeArg): T
}

interface GroupBy {
    groupBy(...columns: NodeArg[]): this & Having
}

interface Having {
    having(...conditions: NodeArg[]): this
}

interface Returning {
    returning(...columns: NodeArg[]): this
}

interface OnConflict<T> {
    abort(...target: NodeArg[]): T
    fail(...target: NodeArg[]): T
    ignore(...target: NodeArg[]): T
    replace(...target: NodeArg[]): T
    rollback(...target: NodeArg[]): T
    nothing(...target: NodeArg[]): T
    // update(
    //     assignments: NodeArg[],
    //     target?: NodeArg[],
    //     condition?: NodeArg,
    // ): T
}

// ---------------------------------------------
// Statement capabilities
// ---------------------------------------------

interface SelectCapabilities extends Where, GroupBy, OrderBy, Limit {
    join: Join<Select>
}

interface InsertCapabilities extends Returning {
    values(...args: NodeArg[]): this
    conflict: OnConflict<Insert>
}

interface UpdateCapabilities extends Where, OrderBy, Limit, Returning {
    conflict: OnConflict<Update>
}

interface DeleteCapabilities extends Where, OrderBy, Limit, Returning {}

// ---------------------------------------------
// Statement builders
// ---------------------------------------------

export class Select extends SqlStatementBuilder implements SelectCapabilities {
    constructor(
        private readonly table: string,
        private readonly columns?: NodeArg[],
    ) {
        super()
        this.addClause(select(this.columns))
        this.addClause(from(this.table))
    }

    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
    }

    get join(): Join<Select> {
        return {
            inner: (table: NodeArg, condition?: NodeArg): this =>
                this.addClause(joinInner(table, condition)),
            left: (table: NodeArg, condition?: NodeArg): this =>
                this.addClause(joinLeft(table, condition)),
            leftOuter: (table: NodeArg, condition?: NodeArg): this =>
                this.addClause(joinLeftOuter(table, condition)),
            cross: (table: NodeArg): this => this.addClause(joinCross(table)),
        }
    }

    groupBy(...columns: NodeArg[]): this {
        return this.addClause(groupBy(...columns))
    }
    having(...conditions: NodeArg[]): this {
        return this.addClause(having(...conditions))
    }
    orderBy(...columns: NodeArg[]): this {
        return this.addClause(orderBy(...columns))
    }
    limit(count: NodeArg): this {
        return this.addClause(limit(count))
    }
    offset(count: NodeArg): this {
        return this.addClause(offset(count))
    }
}

export class Insert extends SqlStatementBuilder implements InsertCapabilities {
    private readonly cols: Node[] = []
    private readonly _values = values()

    constructor(
        private readonly table: string,
        columns: NodeArg[],
    ) {
        super()

        for (const col of columns) {
            this.cols.push(col instanceof Column ? col.node : toNode(col))
        }

        this.addClause(insert(this.table, this.cols))
        this.addClause(this._values)
    }

    get conflict(): OnConflict<Insert> {
        return {
            abort: (...target: NodeArg[]) =>
                this.addClause(onConflictAbort(...target)),
            fail: (...target: NodeArg[]) =>
                this.addClause(onConflictFail(...target)),
            ignore: (...target: NodeArg[]) =>
                this.addClause(onConflictIgnore(...target)),
            replace: (...target: NodeArg[]) =>
                this.addClause(onConflictReplace(...target)),
            rollback: (...target: NodeArg[]) =>
                this.addClause(onConflictRollback(...target)),
            nothing: (...target: NodeArg[]) =>
                this.addClause(onConflictNothing(...target)),
        }
    }

    values(...args: NodeArg[]): this {
        if (args.length !== this.cols.length) {
            throw new Error(
                `Insert requires ${this.cols.length} values. Received ${args.length}.`,
            )
        }

        this._values.addRow(valueList(...args))

        return this
    }

    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}

export class Update extends SqlStatementBuilder implements UpdateCapabilities {
    private readonly assignments: Node[] = []

    constructor(
        private readonly table: string,
        assignments: NodeArg[],
    ) {
        super()

        this.addClause(update(this.table))

        for (const assign of assignments) {
            if (assign instanceof AssignmentNode) {
                this.assignments.push(assign)
            }
        }

        this.addClause(set(...this.assignments))
    }

    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
    }
    orderBy(...columns: NodeArg[]): this {
        return this.addClause(orderBy(...columns))
    }
    limit(count: NodeArg): this {
        return this.addClause(limit(count))
    }
    offset(count: NodeArg): this {
        return this.addClause(offset(count))
    }

    get conflict(): OnConflict<Update> {
        return {
            abort: (...target: NodeArg[]) =>
                this.addClause(onConflictAbort(...target)),
            fail: (...target: NodeArg[]) =>
                this.addClause(onConflictFail(...target)),
            ignore: (...target: NodeArg[]) =>
                this.addClause(onConflictIgnore(...target)),
            replace: (...target: NodeArg[]) =>
                this.addClause(onConflictReplace(...target)),
            rollback: (...target: NodeArg[]) =>
                this.addClause(onConflictRollback(...target)),
            nothing: (...target: NodeArg[]) =>
                this.addClause(onConflictNothing(...target)),
        }
    }

    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}

export class Delete extends SqlStatementBuilder implements DeleteCapabilities {
    constructor(private readonly table: string) {
        super()
        this.addClause(delete_())
        this.addClause(from(this.table))
    }

    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
    }
    orderBy(...columns: NodeArg[]): this {
        return this.addClause(orderBy(...columns))
    }
    limit(count: NodeArg): this {
        return this.addClause(limit(count))
    }
    offset(count: NodeArg): this {
        return this.addClause(offset(count))
    }

    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}
