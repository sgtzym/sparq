import {
    isSqlParam,
    needsQuoting,
    type SqlString,
    toSqlParam,
} from '~/core/sql.ts'
import type { Node, Param, ParameterReg } from '~/core/node.ts'

// ---------------------------------------------
// Primitives
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a raw SQL string.
 */
export class RawNode implements Node {
    constructor(private readonly sql: string) {}

    render(_params: ParameterReg): SqlString {
        return this.sql
    }
}

/**
 * Represents a literal value with automatic parameterisation.
 */
export class LiteralNode implements Node {
    constructor(private readonly value: Param) {}

    render(params: ParameterReg): SqlString {
        return params.add(toSqlParam(this.value))
    }
}

/**
 * Represents an identifier (table/column name) with automatic quoting.
 */
export class IdentifierNode implements Node {
    constructor(private readonly name: string) {}

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
 * Creates a raw SQL string.
 * @param sql The raw SQL string
 * @returns A raw SQL node
 */
export const raw = (sql: string): Node => {
    return new RawNode(sql)
}

/**
 * Creates a literal value.
 * @param value The literal value
 * @returns A literal node
 */
export const val = (value: Param): Node => {
    if (!isSqlParam(value)) {
        throw new Error(`${value} is not a valid SQL value`)
    }
    return new LiteralNode(value)
}

/**
 * Creates a column/table identifier.
 * @param name The column/table name
 * @returns An identifier node
 */
export const id = (name: string): Node => {
    return new IdentifierNode(name)
}
