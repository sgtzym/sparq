import type { SqlValue } from '~/core/sql-types.ts'

import { type Node, type NodeArg, toNode } from '~/core/node.ts'

import { Registry } from '~/core/registry.ts'

import {
    FromNode,
    GroupByNode,
    HavingNode,
    JoinNode,
    LimitNode,
    OrderByNode,
    SelectNode,
    WhereNode,
} from '~/nodes/clauses.ts'

/** */
const query = (...args: NodeArg[]): [string, SqlValue[]] => {
    const ctx = new Registry<SqlValue>()
    const sql: Map<string, string> = new Map()

    const clauseOrder: string[] = [
        SelectNode.name,
        FromNode.name,
        JoinNode.name,
        WhereNode.name,
        HavingNode.name,
        GroupByNode.name,
        OrderByNode.name,
        LimitNode.name,
    ]

    args.map(toNode).forEach((node: Node) => {
        const clauseName: string = node.constructor.name

        // allow multiple joins
        clauseName === JoinNode.name
            ? sql.set(
                clauseName,
                [sql.get(clauseName), node.interpret(ctx)].filter(Boolean).join(
                    ' ',
                ),
            )
            : sql.set(clauseName, node.interpret(ctx))
    })

    return [
        clauseOrder.filter((clause) => sql.has(clause))
            .map((c) => sql.get(c))
            .join(' '),
        ctx.values as SqlValue[],
    ]
}

export { query }
