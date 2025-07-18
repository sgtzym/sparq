import type { SupportedValueType } from 'node:sqlite'
import type { Node } from '@/core/node.ts'
import { type NodeArg, toNode } from '@/core/constructors.ts'
import { Context } from '@/core/context.ts'
import { SelectNode } from '@/nodes/clauses/select.ts'
import { FromNode } from '@/nodes/clauses/from.ts'
import { JoinNode } from '@/nodes/clauses/join.ts'
import { WhereNode } from '@/nodes/clauses/where.ts'
import { GroupByNode } from '@/nodes/clauses/group-by.ts'
import { LimitNode } from '../nodes/limit.ts'
import { OrderByNode } from '../nodes/clauses/order-by.ts'
import { HavingNode } from '../nodes/clauses/having.ts'

export const query = (...args: NodeArg[]): [string, SupportedValueType] => {
    const ctx = new Context()
    const sql: Map<string, string> = new Map()

    const clauseOrder: string[] = [
        SelectNode.name,
        FromNode.name,
        JoinNode.name,
        WhereNode.name,
        GroupByNode.name,
        HavingNode.name,
        OrderByNode.name,
        LimitNode.name,
    ]

    args.map(toNode).forEach((node: Node) => {
        const clauseName: string = node.constructor.name

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
        clauseOrder.filter((name) => sql.has(name))
            .map((name) => sql.get(name))
            .join(' '),
        ctx.values,
    ]
}
