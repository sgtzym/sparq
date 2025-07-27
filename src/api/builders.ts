import type { SqlValue } from '~/core/sql.ts'
import { interpretAll, type Node, type NodeArg, toNode } from '~/core/node.ts'
import { Parameters } from '~/core/parameter-registry.ts'
import {
    FromNode,
    GroupByNode,
    HavingNode,
    JoinNode,
    LimitNode,
    OffsetNode,
    OrderByNode,
    SetNode,
    WhereNode,
} from '~/ast-nodes/clauses.ts'
import { SelectNode, UpdateNode } from '~/ast-nodes/statements.ts'
import { SetQuantifierNode } from '~/ast-nodes/modifiers.ts'
import { select, update } from '~/ast-nodes/factories/statements.ts'
import {
    from,
    groupBy,
    having,
    limit,
    offset,
    orderBy,
    set,
    where,
} from '~/ast-nodes/factories/clauses.ts'
import { crossJoin, innerJoin, leftJoin, leftOuterJoin } from '@sgtzym/sparq'

export type Query = [string, readonly SqlValue[]]

/** */
function renderAST(nodes: Node[], params: Parameters, order: string[]): string {
    const nodeMap = new Map<string, Node[]>()

    for (const node of nodes) {
        const type = node.constructor.name
        if (!nodeMap.has(type)) nodeMap.set(type, [])
        nodeMap.get(type)!.push(node)
    }

    const parts: string[] = []
    for (const nodeType of order) {
        const nodes = nodeMap.get(nodeType) || []
        parts.push(...interpretAll(nodes, params))
    }

    return parts.join(' ')
}

/** */
export class SelectBuilder {
    private clauseOrder = [
        SelectNode.name,
        SetQuantifierNode.name,
        FromNode.name,
        JoinNode.name,
        WhereNode.name,
        GroupByNode.name,
        HavingNode.name,
        OrderByNode.name,
        LimitNode.name,
        OffsetNode.name,
    ]

    private readonly stmt: (() => Node)[] = [] // collect as factory, process to node at the end (prevents ugly "()()")

    constructor(fields: NodeArg[]) {
        this.stmt.push(select(...fields))
    }

    from(table: NodeArg): this {
        this.stmt.push(from(table))
        return this
    }

    join(dir: 'inner' | 'left' | 'leftOuter' | 'cross', table: NodeArg, condition?: NodeArg): this {
        switch (dir) {
            case 'inner':
                this.stmt.push(innerJoin(table, condition))
                break
            case 'left':
                this.stmt.push(leftJoin(table, condition))
                break
            case 'leftOuter':
                this.stmt.push(leftOuterJoin(table, condition))
                break
            case 'cross':
                this.stmt.push(crossJoin(table))
                break
        }

        return this
    }

    where(...args: NodeArg[]): this {
        this.stmt.push(where(...args))
        return this
    }

    groupBy(...fields: NodeArg[]): this {
        this.stmt.push(groupBy(...fields))
        return this
    }

    having(...args: NodeArg[]): this {
        this.stmt.push(having(...args))
        return this
    }

    orderBy(...fields: NodeArg[]): this {
        this.stmt.push(orderBy(...fields))
        return this
    }

    limit(count: number): this {
        this.stmt.push(limit(count))
        return this
    }

    offset(count: number): this {
        this.stmt.push(offset(count))
        return this
    }

    build(): Query {
        const params = new Parameters()
        const sql = renderAST(this.stmt.map(toNode), params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}

/** */
export class UpdateBuilder {
    private clauseOrder = [
        UpdateNode.name,
        SetNode.name,
        WhereNode.name,
        OrderByNode.name,
        LimitNode.name
    ]

    private readonly stmt: (() => Node)[] = []

    constructor(table: NodeArg) {
        this.stmt.push(update(table))
    }

    set(field: NodeArg, value: NodeArg): this {
        this.stmt.push(set(field, value))
        return this
    }

    where(...args: NodeArg[]): this {
        this.stmt.push(where(...args))
        return this
    }

    orderBy(...fields: NodeArg[]): this {
        this.stmt.push(orderBy(...fields))
        return this
    }

    limit(count: number): this {
        this.stmt.push(limit(count))
        return this
    }

    build(): Query {
        const params = new Parameters()
        const sql = renderAST(this.stmt.map(toNode), params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}