import type { SqlValue } from '~/core/sql.ts'
import { ParameterRegistry } from '~/core/parameter-registry.ts'
import { interpretAll, type Node, type NodeExpr } from '~/core/node.ts'

import * as modifiers from '~/ast-nodes/modifiers.ts'
import * as clauses from '~/ast-nodes/clauses.ts'
import * as statements from '~/ast-nodes/statements.ts'

import * as $clauses from '~/factories/clauses.ts'
import * as $statements from '~/factories/statements.ts'

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
        statements.SelectNode.name,
        modifiers.SetQuantifierNode.name,
        clauses.FromNode.name,
        clauses.JoinNode.name,
        clauses.WhereNode.name,
        clauses.GroupByNode.name,
        clauses.HavingNode.name,
        clauses.OrderByNode.name,
        clauses.LimitNode.name,
        clauses.OffsetNode.name,
    ]

    private readonly stmt: Node[] = []

    constructor(table: string, columns?: NodeExpr[]) {
        this.stmt.push($statements._select(columns))
        this.stmt.push($clauses.from(table))
    }

    join(
        dir: 'inner' | 'left' | 'leftOuter' | 'cross',
        table: NodeExpr,
        condition?: NodeExpr,
    ): this {
        switch (dir) {
            case 'inner':
                this.stmt.push($clauses.innerJoin(table, condition))
                break
            case 'left':
                this.stmt.push($clauses.leftJoin(table, condition))
                break
            case 'leftOuter':
                this.stmt.push($clauses.leftOuterJoin(table, condition))
                break
            case 'cross':
                this.stmt.push($clauses.crossJoin(table))
                break
        }

        return this
    }

    where(...conditions: NodeExpr[]): this {
        this.stmt.push($clauses.where(...conditions))
        return this
    }

    groupBy(...columns: string[]): this {
        this.stmt.push($clauses.groupBy(...columns))
        return this
    }

    having(...conditions: NodeExpr[]): this {
        this.stmt.push($clauses.having(...conditions))
        return this
    }

    orderBy(...columns: string[]): this {
        this.stmt.push($clauses.orderBy(...columns))
        return this
    }

    limit(count: number = 1): this {
        this.stmt.push($clauses.limit(count))
        return this
    }

    offset(count: number = 1): this {
        this.stmt.push($clauses.offset(count))
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
        statements.InsertNode.name,
        clauses.ValuesNode.name,
    ]

    private readonly stmt: Node[] = []

    constructor(
        table: NodeExpr,
        columns: NodeExpr[],
        values: Array<NodeExpr[]>,
    ) {
        this.stmt.push($statements._insert(table, columns))
        this.stmt.push($clauses._values(...values))
    }

    build(): Query {
        const params = new ParameterRegistry()
        const sql = renderAST(this.stmt, params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}

export class UpdateBuilder {
    private clauseOrder = [
        statements.UpdateNode.name,
        clauses.SetNode.name,
        clauses.WhereNode.name,
        clauses.OrderByNode.name,
        clauses.LimitNode.name,
        clauses.OffsetNode.name,
    ]

    private readonly stmt: Node[] = []

    constructor(table: NodeExpr, assignments: Array<[string, NodeExpr]>) {
        this.stmt.push($statements._update(table))
        this.stmt.push($clauses._set(assignments))
    }

    where(...conditions: NodeExpr[]): this {
        this.stmt.push($clauses.where(...conditions))
        return this
    }

    orderBy(...columns: string[]): this {
        this.stmt.push($clauses.orderBy(...columns))
        return this
    }

    limit(count: number = 1): this {
        this.stmt.push($clauses.limit(count))
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
        statements.DeleteNode.name,
        clauses.FromNode.name,
        clauses.WhereNode.name,
        clauses.OrderByNode.name,
        clauses.LimitNode.name,
        clauses.OffsetNode.name,
    ]

    private readonly stmt: Node[] = []

    constructor(table: string) {
        this.stmt.push($statements._delete())
        this.stmt.push($clauses.from(table))
    }

    where(...conditions: NodeExpr[]): this {
        this.stmt.push($clauses.where(...conditions))
        return this
    }

    orderBy(...columns: string[]): this {
        this.stmt.push($clauses.orderBy(...columns))
        return this
    }

    limit(count: number = 1): this {
        this.stmt.push($clauses.limit(count))
        return this
    }

    build(): Query {
        const params = new ParameterRegistry()
        const sql = renderAST(this.stmt, params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}
