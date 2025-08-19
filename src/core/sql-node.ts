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
 * Checks if a value is a valid SQL parameter.
 * Use this to validate values before parameterization.
 *
 * @param value - The value to check
 * @returns True if the value can be used as a SQL parameter
 *
 * @example
 * ```ts
 * isSqlParam('hello')        // true (string)
 * isSqlParam(42)             // true (number)
 * isSqlParam(new Date())     // true (Date object)
 * isSqlParam(true)           // true (boolean)
 * isSqlParam({key: 'val'})   // true (object)
 * isSqlParam(function(){})   // false (function)
 * isSqlParam(Symbol('x'))    // false (symbol)
 * ```
 */
export function isSqlParam(value: unknown): value is SqlParam {
    const isBoolean = typeof value === 'boolean'
    const isDate = value instanceof Date
    const isObject = typeof value === 'object' && value !== null

    return isSqlDataType(value) || isBoolean || isDate || isObject
}

/**
 * Base class for all SQL Abstract Syntax Tree (AST) nodes.
 * Provides the foundation for building SQL expressions and statements.
 * Each node knows how to render itself to SQL with proper parameterization.
 */
export abstract class SqlNode {
    protected readonly _priority: number = -1

    /**
     * Gets the priority for ordering SQL clauses in the correct sequence.
     * Lower numbers appear earlier in the final SQL statement.
     *
     * @returns The priority number (lower = earlier in query)
     *
     * @example
     * ```ts
     * // SELECT has priority 0, FROM has 1, WHERE has 3, etc.
     * selectNode.priority  // 0
     * fromNode.priority    // 1
     * whereNode.priority   // 3
     * ```
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
     * const params = new ParameterReg()
     * const node = new LiteralNode('hello')
     * node.render(params)  // ':p1' (and params now contains 'hello')
     * ```
     */
    abstract render(params: ParameterReg): SqlString
}

/**
 * Checks if a value is a SQL node.
 * Use this to distinguish between nodes and literal values.
 *
 * @param value - The value to check
 * @returns True if the value is a SQL node with a render method
 *
 * @example
 * ```ts
 * isSqlNode(new LiteralNode('hello'))  // true
 * isSqlNode('hello')                   // false
 * isSqlNode({render: () => 'SQL'})     // true (duck typing)
 * ```
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
 * Sorts SQL nodes based on their priority for proper clause ordering.
 * Ensures SQL statements are generated in the correct syntax order.
 *
 * @param nodes - The nodes to sort
 * @returns The sorted nodes in execution order
 *
 * @example
 * ```ts
 * // Ensures proper SQL clause order regardless of input order
 * const nodes = [whereNode, selectNode, fromNode]
 * const sorted = sortSqlNodes(nodes)
 * // Result: [selectNode, fromNode, whereNode] (0, 1, 3)
 * ```
 */
export function sortSqlNodes(nodes: SqlNode[]): readonly SqlNode[] {
    return [...nodes].sort((a, b) => {
        const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER
        const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER

        return aPriority - bPriority
    })
}

/**
 * Renders multiple SQL nodes to strings with optional sorting.
 * Converts an array of AST nodes into executable SQL fragments.
 *
 * @param nodes - The nodes to render
 * @param params - The parameter registry for managing query parameters
 * @param sort - Whether to sort nodes by priority first (default: false)
 * @returns Array of rendered SQL strings
 *
 * @example
 * ```ts
 * const params = new ParameterReg()
 * const nodes = [selectNode, fromNode, whereNode]
 *
 * // Without sorting (maintains input order)
 * renderSqlNodes(nodes, params, false)
 * // ['SELECT *', 'FROM users', 'WHERE active = :p1']
 *
 * // With sorting (proper SQL clause order)
 * renderSqlNodes(nodes, params, true)
 * // ['SELECT *', 'FROM users', 'WHERE active = :p1'] (reordered if needed)
 * ```
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
