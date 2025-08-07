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
    onAbort,
    orderBy,
    returning,
    set,
    values,
    where,
} from '~/nodes/clauses.ts'
import { delete_, insert, select, update } from '~/nodes/statements.ts'
import { AssignmentNode, valueList } from '~/nodes/values.ts'
import { Column } from '~/api/column.ts'

interface Filtering {
    where(...conditions: NodeArg[]): this
    orderBy(...columns: NodeArg[]): this
    limit(count: NodeArg): this
    offset(count: NodeArg): this
}

interface Joins {
    joinInner(table: NodeArg, condition?: NodeArg): this
    joinLeft(table: NodeArg, condition?: NodeArg): this
    joinLeftOuter(table: NodeArg, condition?: NodeArg): this
    joinCross(table: NodeArg): this
}

interface ConflictResolving {
    onAbort(...target: NodeArg[]): this
    onFail(...target: NodeArg[]): this
    onIgnore(...target: NodeArg[]): this
    onReplace(...target: NodeArg[]): this
    onRollback(...target: NodeArg[]): this
}

interface SelectStatement extends Filtering, Joins {
    groupBy(...columns: NodeArg[]): this
    having(...conditions: NodeArg[]): this
}

interface InsertStatement extends ConflictResolving {
    values(...args: NodeArg[]): this
    returning(...columns: NodeArg[]): this
}

interface UpdateStatement extends Filtering, ConflictResolving {
    returning(...columns: NodeArg[]): this
}

interface DeleteStatement extends Filtering {
    returning(...columns: NodeArg[]): this
}

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

export class Select extends SqlStatementBuilder implements SelectStatement {
    constructor(
        private readonly table: string,
        private readonly columns?: NodeArg[],
    ) {
        super()
        this.addClause(select(this.columns))
        this.addClause(from(this.table))
    }

    joinInner(table: NodeArg, condition?: NodeArg): this {
        return this.addClause(joinInner(table, condition))
    }
    joinLeft(table: NodeArg, condition?: NodeArg): this {
        return this.addClause(joinLeft(table, condition))
    }
    joinLeftOuter(table: NodeArg, condition?: NodeArg): this {
        return this.addClause(joinLeftOuter(table, condition))
    }
    joinCross(table: NodeArg): this {
        return this.addClause(joinCross(table))
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

    groupBy(...columns: NodeArg[]): this {
        return this.addClause(groupBy(...columns))
    }
    having(...conditions: NodeArg[]): this {
        return this.addClause(having(...conditions))
    }
}

export class Insert extends SqlStatementBuilder implements InsertStatement {
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

    values(...args: NodeArg[]): this {
        if (args.length !== this.cols.length) {
            throw new Error(
                `Insert requires ${this.cols.length} values. Received ${args.length}.`,
            )
        }

        this._values.addRow(valueList(...args))

        return this
    }

    onAbort(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onFail(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onIgnore(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onReplace(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onRollback(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }

    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}

export class Update extends SqlStatementBuilder implements UpdateStatement {
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

    onAbort(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onFail(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onIgnore(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onReplace(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }
    onRollback(...target: NodeArg[]): this {
        return this.addClause(onAbort(...target))
    }

    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}

export class Delete extends SqlStatementBuilder implements DeleteStatement {
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
