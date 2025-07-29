import { type Node, type NodeArg, toNode } from '~/core/node.ts'
import {
    FromNode,
    GroupByNode,
    HavingNode,
    JOIN_TYPES,
    JoinNode,
    type JoinType,
    LimitNode,
    OffsetNode,
    OrderByNode,
    SetNode,
    ValuesNode,
    WhereNode,
} from '~/ast-nodes/clauses.ts'

// Basic clauses

export const from = (...tables: NodeArg[]) => (): Node => {
    return new FromNode(tables.map(toNode))
}

export const where = (...conditions: NodeArg[]) => (): Node => {
    return new WhereNode(conditions.map(toNode))
}

export const groupBy = (...fields: NodeArg[]) => (): Node => {
    return new GroupByNode(fields.map(toNode))
}

export const having = (...conditions: NodeArg[]) => (): Node => {
    return new HavingNode(conditions.map(toNode))
}

export const orderBy = (...fields: NodeArg[]) => (): Node => {
    return new OrderByNode(fields.map(toNode))
}

// Joins

const joinFactory = (type: JoinType) => (table: NodeArg, condition?: NodeArg) => (): Node => {
    return new JoinNode(
        type,
        toNode(table),
        condition ? toNode(condition) : undefined,
    )
}

export const innerJoin = joinFactory(JOIN_TYPES.INNER)
export const leftJoin = joinFactory(JOIN_TYPES.LEFT)
export const leftOuterJoin = joinFactory(JOIN_TYPES.LEFT_OUTER)
export const crossJoin = (table: NodeArg) => (): Node => {
    return new JoinNode(JOIN_TYPES.CROSS, toNode(table))
}

// Others

export const limit = (count: number = 0) => (): Node => {
    return new LimitNode(count)
}

export const offset = (count: number = 0) => (): Node => {
    return new OffsetNode(count)
}

export const _set = (assignments: Array<[NodeArg, NodeArg]>) => (): Node => {
    return new SetNode(assignments.map(([k, v]) => [toNode(k), toNode(v)]))
}

export const _values = (...values: Array<NodeArg[]>) => (): Node => {
    return new ValuesNode(values.map((v) => v.map(toNode)))
}
