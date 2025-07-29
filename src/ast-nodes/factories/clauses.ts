// deno-fmt-ignore-file

import {
    type Node,
    type NodeArg,
    toNode
} from '~/core/node.ts'

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

/** SQL clause node factories 🏭 */

// Basic clauses ->

/**
 * FROM clause
 * 
 * Supports one or multiple tables.
 *
 * @param {NodeArg[]} tables - Table names or subqueries
 * @returns Factory function for FromNode creation
 *
 * @example
 * from('users')
 * from('users', 'posts')
 */
export const from = (...tables: NodeArg[]) => (): Node => {
    return new FromNode(tables.map(toNode))
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
export const where = (...conditions: NodeArg[]) => (): Node => {
    return new WhereNode(conditions.map(toNode))
}

/**
 * GROUP BY clause for aggregation
 *
 * @param {NodeArg[]} fields - Columns to group by
 * @returns Factory function that creates a GroupByNode
 *
 * @example
 * groupBy('department', 'role')
 */
export const groupBy = (...fields: NodeArg[]) => (): Node => {
    return new GroupByNode(fields.map(toNode))
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
export const having = (...conditions: NodeArg[]) => (): Node => {
    return new HavingNode(conditions.map(toNode))
}

/**
 * ORDER BY clause for sorting
 *
 * @param {NodeArg[]} fields - Columns to sort by, optionally with direction
 * @returns Factory function that creates an OrderByNode
 *
 * @example
 * orderBy('created_at')
 * orderBy(desc('created_at'), asc('name'))
 */
export const orderBy = (...fields: NodeArg[]) => (): Node => {
    return new OrderByNode(fields.map(toNode))
}

// Joins ->

/**
 * Creates a join clause node factory.
 *
 * @param {JoinType} type - Type of join
 * @returns Function that creates join nodes
 */
const joinFactory = (type: JoinType) => (table: NodeArg, condition?: NodeArg) => (): Node => {
    return new JoinNode(
        type,
        toNode(table),
        condition ? toNode(condition) : undefined,
    )
}

/**
 * INNER JOIN clause
 *
 * @example
 * innerJoin('posts', eq('users.id', 'posts.user_id'))
 */
export const innerJoin = joinFactory(JOIN_TYPES.INNER)

/**
 * LEFT JOIN clause
 *
 * @example
 * leftJoin('posts', eq('users.id', 'posts.user_id'))
 */
export const leftJoin = joinFactory(JOIN_TYPES.LEFT)

/**
 * LEFT OUTER JOIN clause
 *
 * @example
 * leftOuterJoin('posts', eq('users.id', 'posts.user_id'))
 */
export const leftOuterJoin = joinFactory(JOIN_TYPES.LEFT_OUTER)

/**
 * CROSS JOIN clause
 * No condition is required for cross joins.
 *
 * @example
 * crossJoin('categories')
 */
export const crossJoin = (table: NodeArg) => (): Node => {
    return new JoinNode(JOIN_TYPES.CROSS, toNode(table))
}

// Misc. ->

/**
 * LIMIT clause for result restriction.
 *
 * @param {number} count - Maximum rows to return
 * @returns Factory function that creates a LimitNode
 *
 * @example
 * limit(10)
 */
export const limit = (count: number = 0) => (): Node => {
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
export const offset = (count: number = 0) => (): Node => {
    return new OffsetNode(count)
}

/**
 * SET clause for UPDATE statements
 * 
 * Used internally by UpdateBuilder.
 *
 * @private
 * @param {Array<[NodeArg, NodeArg]>} assignments - Column-value pairs
 * @returns Factory function that creates a SetNode
 */
export const _set = (assignments: Array<[NodeArg, NodeArg]>) => (): Node => {
    return new SetNode(assignments.map(([k, v]) => [toNode(k), toNode(v)]))
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
export const _values = (...values: Array<NodeArg[]>) => (): Node => {
    return new ValuesNode(values.map((v) => v.map(toNode)))
}
