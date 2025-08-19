import { SQL_KEYWORDS, type SqlSnippet } from '~/core/sql-constants.ts'

/**
 * Union type of all SQL-compatible primitive values.
 * Represents values that can be safely parameterized.
 */
export type SqlDataType = null | number | bigint | string | Uint8Array

export type SqlIdentifier = string
export type SqlString = string

const SQL_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Checks if a value needs quoting.
 *
 * @value value - Value to check
 * @returns {boolean} True if needs quoting
 */
export function needsQuoting(value: string): boolean {
    if (typeof value !== 'string') return false

    return !SQL_NAME_PATTERN.test(value) || isSqlKeyword(value)
}

/**
 * Checks if a value is a reserved SQL keyword.
 *
 * @value value - Value to check
 * @returns True if is reserved keyword
 */
export function isSqlKeyword(value: string): boolean {
    return value.toUpperCase() in SQL_KEYWORDS
}

/**
 * Checks if a value is a valid SQL data type.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if valid data type
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
 * Parses a value to a valid SQL data type.
 *
 * @param {unknown} value - Value to parse
 * @returns {SqlDataType} The parsed value as SQL data type
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
 * Creates a syntax snippet based on valid SQLite keywords and string inputs.
 * @param parts - The SQL keywords/strings to use
 * @returns A joined SQLite string
 */
export function sql(...parts: SqlSnippet[]): string {
    return parts
        .flatMap((p) => typeof p === 'string' ? p.split(' ') : p)
        .filter(Boolean)
        .join(' ')
}
