import { SQL_KEYWORDS, type SqlSnippet } from '~/core/sql-constants.ts'

/**
 * Union type of all SQL-compatible primitive values.
 * Represents values that can be safely parameterized.
 */
export type SqlDataType = null | number | bigint | string | Uint8Array

/**
 * Represents a SQL identifier like table or column names.
 */
export type SqlIdentifier = string

/**
 * Represents a rendered SQL string ready for execution.
 */
export type SqlString = string

const SQL_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Determines if an identifier needs SQL quoting.
 * Returns true for special characters or reserved keywords.
 */
export function needsQuoting(value: string): boolean {
    if (typeof value !== 'string') return false

    return !SQL_NAME_PATTERN.test(value) || isSqlKeyword(value)
}

/**
 * Tests if a value is a reserved SQL keyword.
 * Checks case-insensitively against SQL-92 standard.
 */
export function isSqlKeyword(value: string): boolean {
    return value.toUpperCase() in SQL_KEYWORDS
}

/**
 * Validates values for SQL parameterization.
 * Returns true if the value can be safely parameterized.
 */
export function isSqlDataType(value: unknown): value is SqlDataType {
    return (
        value === null ||
        typeof value === 'number' ||
        typeof value === 'bigint' ||
        typeof value === 'string' ||
        value instanceof Uint8Array
    )
}

/**
 * Converts values to SQL-compatible types.
 * Handles booleans, dates, and objects through serialization.
 */
export function toSqlDataType(value: unknown): SqlDataType {
    switch (true) {
        case isSqlDataType(value):
            return value
        case value === undefined:
            return null
        case typeof value === 'boolean':
            return value ? 1 : 0
        case value instanceof Date:
            return value.toISOString()
        case Array.isArray(value) || typeof value === 'object':
            try {
                return JSON.stringify(value)
            } catch (error) {
                throw new TypeError(`Unable to serialize value: ${error}`)
            }
        default:
            throw new TypeError(`Unsupported literal type: ${value}`)
    }
}

/**
 * Joins SQL keywords with proper spacing.
 * Filters empty values and maintains correct syntax.
 */
export function sql(...parts: SqlSnippet[]): string {
    return parts
        .flatMap((p) => typeof p === 'string' ? p.split(' ') : p)
        .filter(Boolean)
        .join(' ')
}
