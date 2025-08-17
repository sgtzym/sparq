import { SQL_KEYWORDS, type SqlSnippet } from '~/core/sql-constants.ts'

export type SqlString = string

/**
 * Union type of all SQL-compatible primitive values.
 * Represents values that can be safely parameterized.
 */
export type SqlDataType = null | number | bigint | string | Uint8Array

export type SqlIdentifier = string

const SQL_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Checks if a value needs quoting.
 *
 * @param {unknown} param - Value to check
 * @returns {boolean} True if needs quoting
 */
export function needsQuoting(param: string): boolean {
    if (typeof param !== 'string') return false

    return !SQL_NAME_PATTERN.test(param) || isSqlKeyword(param)
}

export function isSqlKeyword(param: string): boolean {
    return param.toUpperCase() in SQL_KEYWORDS
}

/**
 * Checks if a value is a valid SQL data type.
 *
 * @param {unknown} arg - Value to check
 * @returns {boolean} True if valid data type
 */
export function isSqlDataType(arg: unknown): arg is SqlDataType {
    return (
        arg === null ||
        typeof arg === 'number' ||
        typeof arg === 'bigint' ||
        typeof arg === 'string' ||
        arg instanceof Uint8Array
    )
}

/**
 * Parses a value to a valid SQL data type.
 *
 * @param {unknown} arg - Value to parse
 * @returns {SqlDataType} The parsed value as SQL data type
 */
export function toSqlDataType(arg: unknown): SqlDataType {
    switch (true) {
        case isSqlDataType(arg):
            return arg
        case arg === undefined:
            return null
        case typeof arg === 'boolean':
            return arg ? 1 : 0
        case arg instanceof Date:
            return arg.toISOString()
        case Array.isArray(arg) || typeof arg === 'object':
            try {
                return JSON.stringify(arg)
            } catch (error) {
                throw new TypeError(`Unable to serialize value: ${error}`)
            }
        default:
            throw new TypeError(`Unsupported literal type: ${arg}`)
    }
}

/**
 * Creates a syntax snippet based on valid SQLite keywords and string inputs.
 * @param snippets - The SQL keywords/strings to use
 * @returns A joined SQLite string
 */
export function sql(...snippets: SqlSnippet[]): string {
    return String(snippets.filter(Boolean).join(' '))
}
