import { type ArrayLike, castArray } from '~/core/utils.ts'
import { sql, type SqlValue } from '~/core/sql.ts'
import type { ParameterRegistry } from '~/core/parameter-registry.ts'
import { IdentifierNode, LiteralNode } from '~/ast-nodes/primitives.ts'

/**
 * Extended SQL value types.
 * Includes JavaScript types that are automatically converted to SQL-compatible values.
 */
export type Param = SqlValue | boolean | Date | undefined

/**
 * Union type for all valid node arguments.
 * Can be a primitive value or a factory function returning a Node.
 */
export type NodeExpr = Param | Node

/**
 * Base interface for all AST nodes.
 * Represents a composable SQL fragment that can be rendered to string.
 */
export interface Node {
    /**
     * Converts the node to its SQL representation.
     *
     * @param {ParameterRegistry} params - Parameter registry for value binding
     * @returns {string} SQL string fragment
     */
    interpret(params: ParameterRegistry): string
}

/** Node type guard */
function isNode(expr: any): expr is Node {
    return expr && typeof expr.interpret === 'function'
}

/** Converts args like factory functions to Nodes */
export function toNode(expr: NodeExpr): Node {
    if (isNode(expr)) return expr

    return sql.isIdentifier(expr)
        ? new IdentifierNode(expr as string)
        : new LiteralNode(sql.toSqlValue(expr))
}

/**
 * Interprets multiple nodes to SQL.
 *
 * @param {ArrayLike<Node>} nodes - Nodes to interpret
 * @param {ParameterRegistry} params - Parameter registry for value binding
 * @returns {string[]} Array of SQL string fragments
 */
export function interpretAll(
    nodes: ArrayLike<Node>,
    params: ParameterRegistry,
): string[] {
    return castArray(nodes).map((n) => n.interpret(params))
}
