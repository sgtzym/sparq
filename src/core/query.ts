import type { SupportedValueType } from 'node:sqlite'
import type {
    FromClause,
    LimitClause,
    SelectClause,
    WhereClause,
} from '@/core/constructors.ts'
import { Context } from '@/core/context.ts'
import type { Node } from './node.ts'
import { SelectNode } from '../nodes/clauses/select.ts'
import { WhereNode } from '../nodes/clauses/where.ts'
import { FromNode } from '../nodes/clauses/from.ts'
import { LimitNode } from '../nodes/clauses/limit.ts'

export const query = (
    ...clauses: (SelectClause | FromClause | WhereClause | LimitClause)[]
): [string, SupportedValueType] => {
    const ctx = new Context()
    const sql: Map<string, string> = new Map()

    const clauseOrder: string[] = [
        FromNode.name,
        SelectNode.name,
        WhereNode.name,
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
