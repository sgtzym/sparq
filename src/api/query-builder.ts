import type { SqlParam, SqlString } from '~/core/sql.ts'
import { Parameters } from '~/core/parameter-registry.ts'
import { type Node, type NodeArg, renderAST, toNode } from '~/core/node.ts'
import * as fac from '~/factories.ts'
import { AssignmentNode } from '~/ast-nodes.ts'
import { Column } from '~/api/column.ts'

interface StatementApi {
    readonly clauses: Node[]
    toSql(): [SqlString, readonly SqlParam[]]
}

export class Select implements StatementApi {
    readonly clauses: Node[] = []

    constructor(
        private readonly table: string,
        private readonly columns?: NodeArg[],
    ) {
        this.clauses.push(fac.select(this.columns))
        this.clauses.push(fac.from(this.table))
    }

    join(
        dir: 'inner' | 'left' | 'leftOuter' | 'cross',
        table: NodeArg,
        condition?: NodeArg,
    ): this {
        switch (dir) {
            case 'inner':
                this.clauses.push(fac.joinInner(table, condition))
                break
            case 'left':
                this.clauses.push(fac.joinLeft(table, condition))
                break
            case 'leftOuter':
                this.clauses.push(fac.joinLeftOuter(table, condition))
                break
            case 'cross':
                this.clauses.push(fac.joinCross(table))
                break
        }

        return this
    }

    where(...conditions: NodeArg[]): this {
        this.clauses.push(fac.where(...conditions))
        return this
    }

    groupBy(...columns: NodeArg[]): this {
        this.clauses.push(fac.groupBy(...columns))
        return this
    }

    having(...conditions: NodeArg[]): this {
        this.clauses.push(fac.having(...conditions))
        return this
    }

    orderBy(...columns: NodeArg[]): this {
        this.clauses.push(fac.orderBy(...columns))
        return this
    }

    limit(count: NodeArg = 1): this {
        this.clauses.push(fac.limit(count))
        return this
    }

    offset(count: NodeArg = 1): this {
        this.clauses.push(fac.offset(count))
        return this
    }

    toSql(): [SqlString, readonly SqlParam[]] {
        const params = new Parameters()
        const sql = renderAST(this.clauses, params)
        return [sql, params.toArray()]
    }
}

export class Insert implements StatementApi {
    readonly clauses: Node[] = []

    private readonly cols: Node[] = []
    private readonly rows: Node[] = []

    constructor(
        private readonly table: string,
        args: NodeArg[],
    ) {
        for (const arg of args) {
            this.cols.push(arg instanceof Column ? arg.node : toNode(arg))
        }

        this.clauses.push(fac.insert(this.table, this.cols))
    }

    values(...values: NodeArg[]): this {
        this.rows.push(fac.valueList(...values))
        return this
    }

    // TODO(#sgtzym): Implement subqueries with SELECT

    toSql(): [SqlString, readonly SqlParam[]] {
        this.clauses.push(fac.values(...this.rows))

        const params = new Parameters()
        const sql = renderAST(this.clauses, params)
        return [sql, params.toArray()]
    }
}

export class Update implements StatementApi {
    readonly clauses: Node[] = []

    private readonly assignments: Node[] = []

    constructor(
        private readonly table: string,
        assignments?: NodeArg[],
    ) {
        this.clauses.push(fac.update(this.table))

        for (const assign of assignments) {
            if (assign instanceof AssignmentNode) {
                this.assignments.push(assign)
            }
        }

        this.clauses.push(fac.set(...this.assignments))
    }

    where(...conditions: NodeArg[]): this {
        this.clauses.push(fac.where(...conditions))
        return this
    }

    orderBy(...columns: NodeArg[]): this {
        this.clauses.push(fac.orderBy(...columns))
        return this
    }

    limit(count: NodeArg = 1): this {
        this.clauses.push(fac.limit(count))
        return this
    }

    offset(count: NodeArg = 1): this {
        this.clauses.push(fac.offset(count))
        return this
    }

    toSql(): [SqlString, readonly SqlParam[]] {
        const params = new Parameters()
        const sql = renderAST(this.clauses, params)
        return [sql, params.toArray()]
    }
}

export class Delete implements StatementApi {
    readonly clauses: Node[] = []

    constructor(private readonly table: string) {
        this.clauses.push(fac.delete_())
        this.clauses.push(fac.from(this.table))
    }

    where(...conditions: NodeArg[]): this {
        this.clauses.push(fac.where(...conditions))
        return this
    }

    orderBy(...columns: NodeArg[]): this {
        this.clauses.push(fac.orderBy(...columns))
        return this
    }

    limit(count: NodeArg = 1): this {
        this.clauses.push(fac.limit(count))
        return this
    }

    offset(count: NodeArg = 1): this {
        this.clauses.push(fac.offset(count))
        return this
    }

    toSql(): [SqlString, readonly SqlParam[]] {
        const params = new Parameters()
        const sql = renderAST(this.clauses, params)
        return [sql, params.toArray()]
    }
}
