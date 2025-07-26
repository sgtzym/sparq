import { type SqlValue } from '../../src/core/sql-constants.ts'

import {
    type Node,
    type NodeArg,
    type NodeContext,
    toNode,
} from '~/core/node.ts'

import { Registry } from '~/core/registry.ts'

import {
    FromNode,
    GroupByNode,
    HavingNode,
    JoinNode,
    LimitNode,
    OrderByNode,
    SetNode,
    WhereNode,
} from '~/nodes/clauses.ts'

import { InsertNode, SelectNode, UpdateNode } from '~/nodes/statements.ts'

type SqlDelimiter = ' ' | ', '

// indicates if clauses can appear multiple times in one statement, separated by the given delimiter
type ClauseDelimiter = SqlDelimiter | undefined

type ClauseOrder = Record<string, ClauseDelimiter>
type QueryResult = [string, SqlValue[]]

/** SQL statement wrapper - interprets parts in given order */
const queryConstructor =
    (clauseOrder: ClauseOrder) => (...args: NodeArg[]): QueryResult => {
        const ctx: NodeContext = new Registry()
        const parts: Map<string, string> = new Map()

        args.map(toNode).forEach((node: Node) => {
            const nodeType: string = node.constructor.name

            clauseOrder[nodeType] !== undefined
                ? parts.set(
                    nodeType,
                    [parts.get(nodeType), node.interpret(ctx)].filter(Boolean)
                        .join(clauseOrder[nodeType]),
                )
                : parts.set(nodeType, node.interpret(ctx))
        })

        return [
            Object.keys(clauseOrder)
                .filter((clause) => parts.has(clause))
                .map((clause) => parts.get(clause))
                .join(' '),
            ctx.values as SqlValue[],
        ]
    }

const selectQuery = queryConstructor({
    [SelectNode.name]: undefined,
    [FromNode.name]: undefined,
    [JoinNode.name]: ' ',
    [WhereNode.name]: undefined,
    [HavingNode.name]: undefined,
    [GroupByNode.name]: undefined,
    [OrderByNode.name]: undefined,
    [LimitNode.name]: undefined,
})

const updateQuery = queryConstructor({
    [UpdateNode.name]: undefined,
    [SetNode.name]: undefined,
    [WhereNode.name]: undefined,
    [OrderByNode.name]: undefined,
    [LimitNode.name]: undefined,
})

const insertQuery = queryConstructor({
    [InsertNode.name]: undefined,
})

export { insertQuery, selectQuery, updateQuery }
