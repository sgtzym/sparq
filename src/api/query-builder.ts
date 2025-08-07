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
    orderBy,
    returning,
    set,
    values,
    where,
} from '~/nodes/clauses.ts'
import { delete_, insert, select, update } from '~/nodes/statements.ts'
import { AssignmentNode, valueList } from '~/nodes/values.ts'
import { Column } from '~/api/column.ts'

abstract class SqlStatementBuilder {
    protected _clauses: Node[]
    protected _sql: SqlString
    protected _params: ParameterReg

    constructor() {
        this._clauses = []
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

    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
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

    limit(count: NodeArg = 1): this {
        return this.addClause(limit(count))
    }

    offset(count: NodeArg = 1): this {
        return this.addClause(offset(count))
    }

    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}

export class Select extends SqlStatementBuilder {
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
}

export class Insert extends SqlStatementBuilder {
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
        this._values.addRow(valueList(...args))
        return this
    }

    // TODO(#sgtzym): Implement subqueries with SELECT

    // TODO(#sgtzym): Implement OnConflictBuilder for UPSERT
}

export class Update extends SqlStatementBuilder {
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
}

export class Delete extends SqlStatementBuilder {
    #unsupportedClauseErrMsg: string = 'is not supported in DELETE statements'

    constructor(private readonly table: string) {
        super()
        this.addClause(delete_())
        this.addClause(from(this.table))
    }

    override groupBy(): never {
        throw new Error(`groupBy ${this.#unsupportedClauseErrMsg}`)
    }

    override having(): never {
        throw new Error(`having ${this.#unsupportedClauseErrMsg}`)
    }

    override returning(): never {
        throw new Error(`returning ${this.#unsupportedClauseErrMsg}`)
    }
}
