import { type ArrayLike, castArray } from '~/core/utils.ts'
import { sql, type SqlValue } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { IdentifierNode, LiteralNode } from '~/ast-nodes/primitives.ts'

/**
 * Extended SQL value types.
 * Includes JavaScript types that are automatically converted to SQL-compatible values.
 */
export type NodeValue = SqlValue | boolean | Date | undefined

/**
 * Union type for all valid node arguments.
 * Can be a primitive value or a factory function returning a Node.
 */
export type NodeArg = NodeValue | (() => Node)

/**
 * Base interface for all AST nodes.
 * Represents a composable SQL fragment that can be rendered to string.
 */
export interface Node {
    /**
     * Converts the node to its SQL representation.
     *
     * @param {Parameters} params - Parameter registry for value binding
     * @returns {string} SQL string fragment
     */
    interpret(params: Parameters): string
}

/**
 * Constructor for API functions.
 * These functions need to resolve any arg to a Node.
 */
export type NodeFactory = (...args: NodeArg[]) => () => Node

/**
 * Converts any valid argument to an AST node.
 * Automatically determines if the value is an identifier or literal.
 *
 * @param {NodeArg} arg - Value to convert
 * @returns {Node} Corresponding AST node
 *
 * @example
 * toNode('users')      // IdentifierNode
 * toNode(42)           // LiteralNode
 * toNode(select())     // SelectNode (from factory)
 */
export function toNode(arg: NodeArg): Node {
    if (typeof arg === 'function') return arg()

    /**
     * TODO(#sgtzym): This needs a proper table/column checking mechanism (incl. auto-completion)
     * Check here if a str value is part of a scheme (either a table or a column name) and set Identifier/Literal Node accordingly
     */
    return sql.isIdentifier(arg)
        ? new IdentifierNode(arg as string)
        : new LiteralNode(arg as SqlValue)
}

/**
 * Interprets multiple nodes to SQL.
 *
 * @param {ArrayLike<Node>} nodes - Nodes to interpret
 * @param {Parameters} params - Parameter registry for value binding
 * @returns {string[]} Array of SQL string fragments
 */
export function interpretAll(nodes: ArrayLike<Node>, params: Parameters): string[] {
    return castArray(nodes).map((n) => n.interpret(params))
}
