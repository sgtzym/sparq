import type { SqlValue } from '~/core/sql.ts'
import { ParameterRegistry } from '~/core/parameter-registry.ts'
import { interpretAll, type Node, type NodeExpr } from '~/core/node.ts'
import { SetQuantifierNode } from '~/ast-nodes/modifiers.ts'
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
import {
    DeleteNode,
    InsertNode,
    SelectNode,
    UpdateNode,
} from '~/ast-nodes/statements.ts'
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
import {
    _delete,
    _insert,
    _select,
    _update,
} from '~/ast-nodes/factories/statements.ts'

/**
 * Compiled SQL query with parameter values.
 */
export type Query = [string, readonly SqlValue[]]

/**
 * Renders AST nodes to SQL in the specified clause order.
 * Groups nodes by type to ensure correct SQL syntax.
 *
 * @param {Node[]} nodes - AST nodes to render
 * @param {ParameterRegistry} params - Parameter registry for value binding
 * @param {string[]} order - Node type names in SQL clause order
 * @returns {string} Generated SQL string
 */
function renderAST(
    nodes: Node[],
    params: ParameterRegistry,
    order: string[],
): string {
    const nodeMap = new Map<string, Node[]>()

    for (const node of nodes) {
        const type = node.constructor.name
        if (!nodeMap.has(type)) nodeMap.set(type, [])
        // TODO(#sgtzym): Allow and join multiple clauses of the same type
        nodeMap.get(type)!.push(node)
    }

    const parts: string[] = []
    for (const nodeType of order) {
        const nodes = nodeMap.get(nodeType) || []
        parts.push(...interpretAll(nodes, params))
    }

    return parts.join(' ')
}

/** Query builders 🧑‍🏭 - Provide fluent APIs for supported SQL operations */

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

    private readonly stmt: Node[] = []

    constructor(table: string, columns?: NodeExpr[]) {
        this.stmt.push(_select(columns))
        this.stmt.push(from(table))
    }

    join(
        dir: 'inner' | 'left' | 'leftOuter' | 'cross',
        table: NodeExpr,
        condition?: NodeExpr,
    ): this {
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

    where(...conditions: NodeExpr[]): this {
        this.stmt.push(where(...conditions))
        return this
    }

    groupBy(...columns: string[]): this {
        this.stmt.push(groupBy(...columns))
        return this
    }

    having(...conditions: NodeExpr[]): this {
        this.stmt.push(having(...conditions))
        return this
    }

    orderBy(...columns: string[]): this {
        this.stmt.push(orderBy(...columns))
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
        const params = new ParameterRegistry()
        const sql = renderAST(this.stmt, params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}

export class InsertBuilder {
    private clauseOrder = [
        InsertNode.name,
        ValuesNode.name,
    ]

    private readonly stmt: Node[] = []

    constructor(
        table: NodeExpr,
        columns: NodeExpr[],
        values: Array<NodeExpr[]>,
    ) {
        this.stmt.push(_insert(table, columns))
        this.stmt.push(_values(...values))
    }

    build(): Query {
        const params = new ParameterRegistry()
        const sql = renderAST(this.stmt, params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}

export class UpdateBuilder {
    private clauseOrder = [
        UpdateNode.name,
        SetNode.name,
        WhereNode.name,
        OrderByNode.name,
        LimitNode.name,
        OffsetNode.name,
    ]

    private readonly stmt: Node[] = []

    constructor(table: NodeExpr, assignments: Array<[string, NodeExpr]>) {
        this.stmt.push(_update(table))
        this.stmt.push(_set(assignments))
    }

    where(...conditions: NodeExpr[]): this {
        this.stmt.push(where(...conditions))
        return this
    }

    orderBy(...columns: string[]): this {
        this.stmt.push(orderBy(...columns))
        return this
    }

    limit(count: number): this {
        this.stmt.push(limit(count))
        return this
    }

    build(): Query {
        const params = new ParameterRegistry()
        const sql = renderAST(this.stmt, params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}

export class DeleteBuilder {
    private clauseOrder = [
        DeleteNode.name,
        FromNode.name,
        WhereNode.name,
        OrderByNode.name,
        LimitNode.name,
        OffsetNode.name,
    ]

    private readonly stmt: Node[] = []

    constructor(table: string) {
        this.stmt.push(_delete())
        this.stmt.push(from(table))
    }

    where(...conditions: NodeExpr[]): this {
        this.stmt.push(where(...conditions))
        return this
    }

    orderBy(...columns: string[]): this {
        this.stmt.push(orderBy(...columns))
        return this
    }

    limit(count: number): this {
        this.stmt.push(limit(count))
        return this
    }

    build(): Query {
        const params = new ParameterRegistry()
        const sql = renderAST(this.stmt, params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}
