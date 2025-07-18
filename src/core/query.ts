import type { SupportedValueType } from 'node:sqlite'
import type { Node } from '@/core/node.ts'
import { Context } from '@/core/context.ts'
import { SelectNode } from '@/nodes/clauses/select.ts'
import { FromNode } from '@/nodes/clauses/from.ts'
import { JoinNode } from '@/nodes/clauses/join.ts'
import { WhereNode } from '@/nodes/clauses/where.ts'
import { GroupByNode } from '@/nodes/clauses/group-by.ts'
import { LimitNode } from '../nodes/limit.ts'
import type {
    FromClause,
    GroupByClause,
    JoinClause,
    LimitClause,
    OrderByClause,
    SelectClause,
    WhereClause,
} from '@/core/constructors.ts'
import { OrderByNode } from '../nodes/clauses/order-by.ts'

type Clause =
    | SelectClause
    | FromClause
    | JoinClause
    | WhereClause
    | GroupByClause
    | OrderByClause
    | LimitClause

export const query = (
    ...clauses: Clause[]
): [string, SupportedValueType] => {
    const ctx = new Context()
    const sql: Map<string, string> = new Map()

    const clauseOrder: string[] = [
        SelectNode.name,
        FromNode.name,
        JoinNode.name,
        WhereNode.name,
        GroupByNode.name,
        // TODO: Having
        OrderByNode.name,
        LimitNode.name,
    ]

    clauses.forEach((clause) => {
        const node: Node = clause()
        const clauseName: string = node.constructor.name

        sql.set(clauseName, node.interpret(ctx))
    })

    return [
        clauseOrder.filter((name) => sql.has(name))
            .map((name) => sql.get(name))
            .join(' '),
        ctx.values,
    ]
}
