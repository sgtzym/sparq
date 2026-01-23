import {
	type OneOrMany,
	type ParameterReg,
	renderSqlNodes,
	sql,
	SqlNode,
	type SqlNodeValue,
	type SqlString,
} from '~core'
import { expr, id } from '~node'

// ---------------------------------------------
// Common table expressions (CTEs)
// ---------------------------------------------

// -> 🔷 Nodes

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

export class WithNode extends SqlNode {
	override readonly _priority: number = -1

	constructor(
		private readonly ctes: OneOrMany<CteNode>,
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
 * Defines a Common Table Expression (CTE) for reusable subqueries.
 *
 * @param name - The CTE name (acts like a temporary table)
 * @param query - The query nodes that define the CTE's data
 * @returns A CTE node for use in WITH clauses
 *
 * @example
 * ```ts
 * const highValueCustomers = cte('high_value_customers', [
 *   selectNode, fromNode, whereNode
 * ])
 * ```
 */
export const cte = (name: string, query: SqlNodeValue[]): CteNode =>
	new CteNode(id(name), query.map(expr))

/**
 * Adds CTEs to the beginning of a query using WITH.
 *
 * @param recursive - Whether to use WITH RECURSIVE for hierarchical data
 * @param ctes - The CTE nodes to include
 * @returns A WITH clause that prefixes your main query
 *
 * @example
 * ```ts
 * // WITH cte1 AS (...), cte2 AS (...)
 * with_(false, cte1, cte2)
 *
 * // WITH RECURSIVE tree AS (...)
 * with_(true, treeQuery)
 * ```
 */
export const with_ = (recursive?: boolean, ...ctes: CteNode[]): WithNode =>
	new WithNode(ctes, recursive)
