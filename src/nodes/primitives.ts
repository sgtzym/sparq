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
 * Represents a raw SQL string.
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
 * Represents a literal value with automatic parameterisation.
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
 * Represents an identifier (table/column name) with automatic quoting.
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
 * Creates a raw SQL string.
 * @param sql The raw SQL string
 * @returns A raw SQL node
 */
export const raw = (sql: string): SqlNode => {
    return new RawNode(sql)
}

/**
 * Creates a literal value.
 * @param value The literal value
 * @returns A literal node
 */
export const expr = (value: SqlNodeValue): SqlNode => {
    return isSqlNode(value) ? value : new LiteralNode(value)
}

/**
 * Creates a column/table identifier.
 * @param value The column/table name
 * @returns An identifier node
 */
export const id = (value: SqlNodeValue): SqlNode => {
    return isSqlNode(value) ? value : new IdentifierNode(value as string)
}
