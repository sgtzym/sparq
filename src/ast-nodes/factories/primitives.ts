import { sql } from '~/core/sql.ts'
import type { Node, NodeValue } from '~/core/node.ts'
import { IdentifierNode, LiteralNode, RawNode } from '~/ast-nodes/primitives.ts'

/** SQL primitive node factories 🏭 */

/**
 * Raw SQL
 *
 * Bypasses parameterization - use with caution!
 *
 * @param {string} sql - Raw SQL string to embed
 * @returns A factory function that creates a RawNode
 *
 * @example
 * raw('CURRENT_TIMESTAMP')
 */
const raw = (sql: string) => (): Node => {
    return new RawNode(sql)
}

/**
 * Identifier (table/column)
 *
 * Validates and quotes identifiers as needed.
 *
 * @param {string} name - Table or column identifier
 * @returns A factory function that creates an IdentifierNode
 * @throws {Error} If the name is not a valid identifier
 *
 * @example
 * id('users')
 * id('users.email')
 */
const id = (name: string) => (): Node => {
    if (!sql.isIdentifier(name)) {
        throw new Error(`${name} is not an identifier`)
    }
    return new IdentifierNode(name)
}

/**
 * Literal value
 *
 * Values are parameterized for SQL injection protection.
 *
 * @param {NodeArg} value - Literal value to parameterize
 * @returns A factory function that creates a LiteralNode
 * @throws {Error} If the value is not a valid SQL type
 *
 * @example
 * val('John Doe')
 * val(42)
 * val(null)
 */
const val = (value: NodeValue) => (): Node => {
    if (!sql.isSqlValue(value)) {
        throw new Error(`${value} is not a SQL value`)
    }
    return new LiteralNode(value)
}

export { id, raw, val }
