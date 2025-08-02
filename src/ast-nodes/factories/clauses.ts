import { sql } from '~/core/sql.ts'
import { type NodeExpr, type Node, toNode } from '~/core/node.ts'
import { IdentifierNode, LiteralNode } from '~/ast-nodes/primitives.ts'
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

/** 🏭 Node factories: Clauses */

//Basic clauses
export const from = (...tables: string[]) =>
    new FromNode(tables.map((table) => new IdentifierNode(table)))

export const where = (...conditions: NodeExpr[]) =>
    new WhereNode(conditions.map(toNode))

export const groupBy = (...columns: string[]) =>
    new GroupByNode(columns.map((col) => new IdentifierNode(col)))

export const having = (...conditions: NodeExpr[]) =>
    new HavingNode(conditions.map(toNode))

export const orderBy = (...columns: string[]) =>
    new OrderByNode(columns.map((col) => new IdentifierNode(col)))

export const limit = (count: number = 1) => new LimitNode(count)

export const offset = (count: number = 0) => new OffsetNode(count)

// Joins
const join = (type: JoinType) => (table: NodeExpr, condition?: NodeExpr): Node =>
    new JoinNode(type, toNode(table), condition ? toNode(condition) : undefined)

export const innerJoin = join(JOIN_TYPES.INNER)
export const leftJoin = join(JOIN_TYPES.LEFT)
export const leftOuterJoin = join(JOIN_TYPES.LEFT_OUTER)
export const crossJoin = (table: NodeExpr): Node =>
    new JoinNode(JOIN_TYPES.CROSS, toNode(table))

// Components (internal use only)
export const _set = (assignments: Array<[NodeExpr, NodeExpr]>): Node =>
    new SetNode(assignments.map(([k, v]) => [toNode(k), toNode(v)]))

export const _values = (...values: Array<NodeExpr[]>): Node =>
    new ValuesNode(
        values.map((row) => row.map((v) => new LiteralNode(sql.toSqlValue(v)))),
    )
