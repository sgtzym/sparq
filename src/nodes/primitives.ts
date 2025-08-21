import { needsQuoting, type SqlString, toSqlDataType } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import {
    isSqlNode,
    SqlNode,
    type SqlNodeValue,
    type SqlParam,
} from '~/core/sql-node.ts'

// ---------------------------------------------
// Primitives
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a raw SQL string that won't be parameterized.
 * Use this for SQL keywords, operators, and trusted static content.
 */
export class RawNode extends SqlNode {
    constructor(private readonly sql: string) {
        super()
    }

    render(_params: ParameterReg): SqlString {
        return this.sql
    }
}

/**
 * Represents a literal value that will be automatically parameterized.
 * Converts user data into safe SQL parameters to prevent injection attacks.
 */
export class LiteralNode extends SqlNode {
    constructor(private readonly value: SqlParam) {
        super()
    }

    render(params: ParameterReg): SqlString {
        return params.add(toSqlDataType(this.value))
    }
}

/**
 * Represents a SQL identifier with automatic quoting when needed.
 * Handles table names, column names, and other identifiers safely.
 */
export class IdentifierNode extends SqlNode {
    constructor(private readonly name: string) {
        super()
    }

    render(_params: ParameterReg): SqlString {
        const sql: string = this.name
            .split('.')
            .map((part) => (needsQuoting(part) ? `"${part}"` : part))
            .join('.')

        return sql
    }
}

// -> 🏭 Factories

/**
 * Creates a raw SQL string node that won't be parameterized.
 * Use this for SQL keywords, operators, and trusted static content.
 *
 * @example
 * ```ts
 * raw('SELECT')     // SELECT (not parameterized)
 * raw('COUNT(*)')   // COUNT(*) (not parameterized)
 * raw('INNER JOIN') // INNER JOIN (not parameterized)
 * ```
 */
export const raw = (sql: string): SqlNode => {
    return new RawNode(sql)
}

/**
 * Creates a literal value node that will be automatically parameterized.
 * Use this for user data and dynamic values to prevent SQL injection.
 *
 * @example
 * ```ts
 * expr('hello')    // Creates :p1 parameter with value 'hello'
 * expr(42)         // Creates :p2 parameter with value 42
 * expr(true)       // Creates :p3 parameter with value 1 (SQLite boolean)
 * expr(new Date()) // Creates :p4 parameter with ISO date string
 * expr(someNode)   // Returns someNode unchanged (already a SQL node)
 * ```
 */
export const expr = (value: SqlNodeValue): SqlNode => {
    return isSqlNode(value) ? value : new LiteralNode(value)
}

/**
 * Creates an identifier node with automatic quoting when needed.
 * Use this for table names, column names, and other database identifiers.
 *
 * @example
 * ```ts
 * id('user')       // user (no quotes needed)
 * id('user-id')    // "user-id" (quotes added for dash)
 * id('SELECT')     // "SELECT" (reserved keyword quoted)
 * id('my.table')   // "my"."table" (schema.table with quotes as needed)
 * id(existingNode) // Returns existingNode unchanged
 * ```
 */
export const id = (value: SqlNodeValue): SqlNode => {
    return isSqlNode(value) ? value : new IdentifierNode(value as string)
}
