import { type ArrayLike, castArray } from '~/core/utils.ts'
import { isSqlDataType, type SqlDataType, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'

// ---------------------------------------------
// SQL node basics
// ---------------------------------------------

/**
 * Union type for values that can be used as SQL parameters.
 * Extends SqlDataType to include complex types that need conversion.
 */
export type SqlParam =
	| SqlDataType
	| boolean
	| Date
	| Record<string, any>
	| undefined

/**
 * Validates if a value can be used as a SQL parameter.
 */
export function isSqlParam(value: unknown): value is SqlParam {
	const isBoolean = typeof value === 'boolean'
	const isDate = value instanceof Date
	const isObject = typeof value === 'object' && value !== null

	return isSqlDataType(value) || isBoolean || isDate || isObject
}

/**
 * Base class for SQL Abstract Syntax Tree nodes.
 * Each node renders itself to parameterized SQL.
 */
export abstract class SqlNode {
	protected readonly _priority: number = -1

	/**
	 * Gets the priority for ordering SQL clauses in the correct sequence.
	 * Lower numbers appear earlier in the final SQL statement.
	 */
	get priority(): number {
		return this._priority
	}

	/**
	 * Renders the node to a SQL string with proper parameterization.
	 * This is the core method that converts AST nodes to executable SQL.
	 *
	 * @param params - The parameter registry for managing query parameters
	 * @returns The rendered SQL string for this node
	 *
	 * @example
	 * ```ts
	 * const node: SqlNode = new LiteralNode('hello')
	 * node.render(new ParameterReg()) // ':p1', [ 'hello' ]
	 * ```
	 */
	abstract render(params: ParameterReg): SqlString
}

/**
 * Identifies SQL node instances.
 * Distinguishes between nodes and literal values.
 */
export function isSqlNode(value: any): value is SqlNode {
	return value &&
		(value instanceof SqlNode || typeof value.render === 'function')
}

/**
 * Union type for values that can be used in SQL expressions.
 * Can be either a SQL node or a parameter value.
 */
export type SqlNodeValue = SqlNode | SqlParam

// ---------------------------------------------
// Sorting and rendering
// ---------------------------------------------

/**
 * Orders nodes by priority for valid SQL syntax.
 */
export function sortSqlNodes(nodes: SqlNode[]): readonly SqlNode[] {
	return [...nodes].sort((a, b) => {
		const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER
		const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER

		return aPriority - bPriority
	})
}

/**
 * Converts AST nodes to SQL strings.
 * Optionally sorts by priority before rendering.
 */
export function renderSqlNodes(
	nodes: ArrayLike<SqlNode>,
	params: ParameterReg,
	sort: boolean = false,
): string[] {
	return sort
		? [...sortSqlNodes(castArray(nodes))].map((n) => n.render(params))
		: castArray(nodes).map((n) => n.render(params))
}
