import { sql, type SqlValue } from '~/core/sql.ts'
import { interpretAll, toNode, type Node, type NodeArg } from '~/core/node.ts'
import { Parameters } from '~/core/parameter-registry.ts'
import {
    FromNode,
    GroupByNode,
    HavingNode,
    JoinNode,
    LimitNode,
    OffsetNode,
    OrderByNode,
    WhereNode,
} from '~/ast-nodes/clauses.ts'
import { SelectNode } from '~/ast-nodes/statements.ts'
import { SetQuantifierNode } from '~/ast-nodes/modifiers.ts'
import { select } from '~/ast-nodes/factories/statements.ts'
import { distinct } from '~/ast-nodes/factories/modifiers.ts'
import { from, where } from '~/ast-nodes/factories/clauses.ts'

export type Query = [string, readonly SqlValue[]]

/** */
function renderNodes(nodes: Node[], params: Parameters, order: string[]): string {
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

    private readonly nodes: Node[] = []

    constructor(fields: NodeArg[]) {
        this.nodes.push(select(...fields)())
    }

    from(table: NodeArg): this {
        this.nodes.push(from(table)())
        return this
    }

    where(...args: NodeArg[]): this {
        this.nodes.push(where(...args)())
        return this
    }

    build(): Query {
        const params = new Parameters()
        const sql = renderNodes(this.nodes, params, this.clauseOrder)
        return [sql, params.toArray()]
    }
}
