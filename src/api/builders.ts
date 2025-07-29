import type { SqlValue } from '~/core/sql.ts'
import { interpretAll, type Node, type NodeArg, NodeValue, toNode } from '~/core/node.ts'
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
    ValuesNode,
    WhereNode,
} from '~/ast-nodes/clauses.ts'
import { DeleteNode, InsertNode, SelectNode, UpdateNode } from '~/ast-nodes/statements.ts'
import { SetQuantifierNode } from '~/ast-nodes/modifiers.ts'
import { _delete, _insert, _select, _update } from '~/ast-nodes/factories/statements.ts'
import {
    _set,
    _values,
    crossJoin,
    from,
    groupBy,
    having,
    innerJoin,
    leftJoin,
    leftOuterJoin,
    limit,
    offset,
    orderBy,
    where,
} from '~/ast-nodes/factories/clauses.ts'

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

    constructor(table: NodeArg, fields?: NodeArg[]) {
        this.stmt.push(_select(fields))
        this.stmt.push(from(table))
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
export class InsertBuilder {
    private clauseOrder = [
        InsertNode.name,
        ValuesNode.name,
    ]

    private readonly stmt: (() => Node)[] = []

    constructor(table: NodeArg, fields: NodeArg[], values: Array<NodeArg[]>) {
        this.stmt.push(_insert(table, fields))
        this.stmt.push(_values(...values))
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
        LimitNode.name,
    ]

    private readonly stmt: (() => Node)[] = []

    constructor(table: NodeArg, assignments: Array<[NodeArg, NodeArg]>) {
        this.stmt.push(_update(table))
        this.stmt.push(_set(assignments))
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

/** */
export class DeleteBuilder {
    private clauseOrder = [
        DeleteNode.name,
        FromNode.name,
        WhereNode.name,
        OrderByNode.name,
        LimitNode.name,
    ]

    private readonly stmt: (() => Node)[] = []

    constructor(table: NodeArg) {
        this.stmt.push(_delete())
        this.stmt.push(from(table))
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
