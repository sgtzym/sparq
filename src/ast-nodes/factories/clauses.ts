import { type Node, type NodeArg, type NodeFactory, toNode } from '~/core/node.ts'

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

import { IdentifierNode, LiteralNode } from '../primitives.ts'

import type { SqlValue } from '../../core/sql.ts'

/** SQL clause node factories 🏭 */

// -> Basic clauses

/**
 * FROM clause
 *
 * Supports one or multiple tables.
 *
 * @param {string[]} tables - Table names or subqueries
 * @returns Factory function for FromNode creation
 *
 * @example
 * from('users')
 * from('users', 'posts')
 */
export const from: NodeFactory = (...tables: string[]) => (): Node => {
    return new FromNode(tables.map((table) => new IdentifierNode(table)))
}

/**
 * WHERE clause
 *
 * Conditions are combined by AND.
 *
 * @param {NodeArg[]} conditions - Filter conditions
 * @returns Factory function that creates a WhereNode
 *
 * @example
 * where(eq('status', 'active'), gt('age', 18))
 */
export const where: NodeFactory = (...conditions: NodeArg[]) => (): Node => {
    return new WhereNode(conditions.map(toNode))
}

/**
 * GROUP BY clause for aggregation
 *
 * @param {string[]} columns - Columns to group by
 * @returns Factory function that creates a GroupByNode
 *
 * @example
 * groupBy('department', 'role')
 */
export const groupBy: NodeFactory = (...columns: string[]) => (): Node => {
    return new GroupByNode(columns.map((col) => new IdentifierNode(col)))
}

/**
 * HAVING clause for filtering grouped results
 *
 * @param {NodeArg[]} conditions - Conditions for aggregated data
 * @returns Factory function that creates a HavingNode
 *
 * @example
 * having(gt(count('id'), 5))
 */
export const having: NodeFactory = (...conditions: NodeArg[]) => (): Node => {
    return new HavingNode(conditions.map(toNode))
}

/**
 * ORDER BY clause for sorting
 *
 * @param {string[]} columns - Columns to sort by, optionally with direction
 * @returns Factory function that creates an OrderByNode
 *
 * @example
 * orderBy('created_at')
 * orderBy(desc('created_at'), asc('name'))
 */
export const orderBy: NodeFactory = (...columns: string[]) => (): Node => {
    return new OrderByNode(columns.map((col) => new IdentifierNode(col)))
}

// -> Joins

/**
 * Creates a join clause node factory.
 *
 * @param {JoinType} type - Type of join
 * @returns Function that creates join nodes
 */
const joinFactory = (type: JoinType) => (table: string, condition?: NodeArg) => (): Node => {
    return new JoinNode(
        type,
        new IdentifierNode(table),
        condition ? toNode(condition) : undefined,
    )
}

/**
 * INNER JOIN clause
 *
 * @example
 * innerJoin('posts', eq('users.id', 'posts.user_id'))
 */
export const innerJoin: NodeFactory = joinFactory(JOIN_TYPES.INNER)

/**
 * LEFT JOIN clause
 *
 * @example
 * leftJoin('posts', eq('users.id', 'posts.user_id'))
 */
export const leftJoin: NodeFactory = joinFactory(JOIN_TYPES.LEFT)

/**
 * LEFT OUTER JOIN clause
 *
 * @example
 * leftOuterJoin('posts', eq('users.id', 'posts.user_id'))
 */
export const leftOuterJoin: NodeFactory = joinFactory(JOIN_TYPES.LEFT_OUTER)

/**
 * CROSS JOIN clause
 * No condition is required for cross joins.
 *
 * @example
 * crossJoin('categories')
 */
export const crossJoin: NodeFactory = (table: string) => (): Node => {
    return new JoinNode(JOIN_TYPES.CROSS, new IdentifierNode(table))
}

// -> Misc.

/**
 * LIMIT clause for result restriction.
 *
 * @param {number} count - Maximum rows to return
 * @returns Factory function that creates a LimitNode
 *
 * @example
 * limit(10)
 */
export const limit: NodeFactory = (count: number = 0) => (): Node => {
    return new LimitNode(count)
}

/**
 * OFFSET clause for pagination.
 *
 * @param {number} count - Rows to skip
 * @returns Factory function that creates an OffsetNode
 *
 * @example
 * offset(20)
 */
export const offset: NodeFactory = (count: number = 0) => (): Node => {
    return new OffsetNode(count)
}

/**
 * SET clause for UPDATE statements
 *
 * Used internally by UpdateBuilder.
 *
 * @private
 * @param {Array<[string, NodeArg]>} assignments - Column-value pairs
 * @returns Factory function that creates a SetNode
 */
export const _set: (assignments: Array<[string, NodeArg]>) => () => Node =
    (assignments: Array<[string, NodeArg]>) => (): Node => {
        return new SetNode(assignments.map(([k, v]) => [new IdentifierNode(k), toNode(v)]))
    }

/**
 * VALUES clause for INSERT statements
 *
 * Used internally by InsertBuilder.
 *
 * @private
 * @param {Array<NodeArg[]>} values - Rows of values to insert
 * @returns Factory function that creates a ValuesNode
 */
export const _values: (...rows: Array<NodeArg[]>) => () => Node =
    (...rows: Array<NodeArg[]>) => (): Node => {
        return new ValuesNode(rows.map((row) => row.map((val) => new LiteralNode(val as SqlValue))))
    }
