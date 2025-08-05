import type { SqlString, SqlValue } from '~/core/sql.ts'

import { Parameters } from '~/core/parameter-registry.ts'
import { type Node, type NodeArg, renderAST } from '~/core/node.ts'

import * as fac from '~/factories.ts'

export class Select {
    private readonly nodes: Node[] = []

    constructor(table: string, columns?: NodeArg[]) {
        this.nodes.push(fac.select(columns))
        this.nodes.push(fac.from(table))
    }

    join(
        dir: 'inner' | 'left' | 'leftOuter' | 'cross',
        table: NodeArg,
        condition?: NodeArg,
    ): this {
        switch (dir) {
            case 'inner':
                this.nodes.push(fac.joinInner(table, condition))
                break
            case 'left':
                this.nodes.push(fac.joinLeft(table, condition))
                break
            case 'leftOuter':
                this.nodes.push(fac.joinLeftOuter(table, condition))
                break
            case 'cross':
                this.nodes.push(fac.joinCross(table))
                break
        }

        return this
    }

    where(...conditions: NodeArg[]): this {
        this.nodes.push(fac.where(...conditions))
        return this
    }

    groupBy(...columns: string[]): this {
        this.nodes.push(fac.groupBy(...columns))
        return this
    }

    having(...conditions: NodeArg[]): this {
        this.nodes.push(fac.having(...conditions))
        return this
    }

    orderBy(...columns: string[]): this {
        this.nodes.push(fac.orderBy(...columns))
        return this
    }

    limit(count: number = 1): this {
        this.nodes.push(fac.limit(count))
        return this
    }

    offset(count: number = 1): this {
        this.nodes.push(fac.offset(count))
        return this
    }

    toSql(): [SqlString, readonly SqlValue[]] {
        const params = new Parameters()
        const sql = renderAST(this.nodes, params)
        return [sql, params.toArray()]
    }
}
