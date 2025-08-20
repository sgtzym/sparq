import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Common table expressions (CTEs)
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a Common Table Expression (CTE) for creating temporary named result sets.
 * Makes complex queries more readable by breaking them into logical components.
 */
export class CteNode extends SqlNode {
    constructor(
        private readonly name: SqlNode,
        private readonly clauses: SqlNode[],
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _name: SqlString = this.name.render(params)
        const _clauses: SqlString = renderSqlNodes(this.clauses, params).join(
            ' ',
        )

        return sql(`${_name} AS (${_clauses})`)
    }
}

/**
 * Represents a WITH clause containing one or more CTEs.
 * Allows you to define temporary result sets at the beginning of your query.
 */
export class WithNode extends SqlNode {
    override readonly _priority: number = -1

    constructor(
        private readonly ctes: ArrayLike<CteNode>,
        private readonly recursive: boolean = false,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _ctes: SqlString = renderSqlNodes(this.ctes, params).join(', ')

        return sql(this.recursive ? 'WITH RECURSIVE' : 'WITH', _ctes)
    }
}

// -> 🏭 Factories

/**
 * Creates a Common Table Expression (CTE) with a name and query.
 * Use this to define reusable subqueries that make complex queries more readable.
 *
 * @param name - The name for the CTE (acts like a temporary table name)
 * @param query - The query nodes that define the CTE's data
 * @returns A CTE node that can be used in WITH clauses
 *
 * @example
 * ```ts
 * // Define a CTE for high-value customers
 * const highValueCustomers = cte('high_value_customers', [
 *   selectNode, fromNode, whereNode
 * ])
 * // high_value_customers AS (SELECT ... FROM ... WHERE ...)
 *
 * // More practical example with actual query builder
 * const activeUsers = users
 *   .select(user.id, user.name, user.email)
 *   .where(user.active.eq(true), user.lastLogin.gt(lastWeek))
 *
 * const highValueOrders = orders
 *   .select(order.userId, sum(order.total).as('total_spent'))
 *   .where(order.status.eq('completed'))
 *   .groupBy(order.userId)
 *   .having(sum(order.total).gt(1000))
 * ```
 */
export const cte = (name: string, query: SqlNodeValue[]): CteNode =>
    new CteNode(id(name), query.map(expr))

/**
 * Creates a WITH clause to define CTEs at the beginning of a query.
 * Use this to include one or more CTEs in your main query.
 *
 * @param recursive - Whether to use WITH RECURSIVE for hierarchical data
 * @param ctes - The CTE nodes to include in the WITH clause
 * @returns A WITH clause node that prefixes your main query
 *
 * @example
 * ```ts
 * // Single CTE
 * with_(false, cte1)
 * // WITH cte1 AS (...)
 *
 * // Multiple CTEs
 * with_(false, cte1, cte2, cte3)
 * // WITH cte1 AS (...), cte2 AS (...), cte3 AS (...)
 *
 * // Recursive CTE for hierarchical data
 * with_(true, recursiveCte)
 * // WITH RECURSIVE recursive_cte AS (...)
 *
 * // Complete example with actual usage
 * const activeUsers = cte('active_users',
 *   users.select(user.id, user.name)
 *     .where(user.active.eq(true))
 *     ._parts
 * )
 *
 * const recentOrders = cte('recent_orders',
 *   orders.select(order.userId, order.total)
 *     .where(order.createdAt.gt(lastMonth))
 *     ._parts
 * )
 *
 * // Main query using the CTEs
 * const finalQuery = users
 *   .select('*')
 *   .with_(false, activeUsers, recentOrders)
 *   .where(user.id.in([1, 2, 3]))
 * ```
 */
export const with_ = (recursive?: boolean, ...ctes: CteNode[]): WithNode =>
    new WithNode(ctes, recursive)
