import { SQL_KEYWORDS as SQL } from '~/core/sql-constants.ts'

/**
 * Union type of all SQL-compatible primitive values.
 * Represents values that can be safely parameterized.
 */
export type SqlValue = null | number | bigint | string | Uint8Array

export type SqlIdentifier = string

const SQL_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Checks if a value is a valid SQL identifier.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if valid identifier
 */
function isIdentifier(value: unknown): value is SqlIdentifier {
    return typeof value === 'string' && SQL_IDENTIFIER_PATTERN.test(value)
}

/**
 * Checks if a value needs quoting.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if needs quoting
 */
function needsQuoting(value: string): boolean {
    return (
        !SQL_IDENTIFIER_PATTERN.test(value) ||
        value.toUpperCase() in SQL
    )
}

/**
 * Checks if a value is a valid SQL data type.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if valid data type
 */
function isSqlValue(
    value: unknown,
): value is SqlValue {
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
 * @returns {SqlValue} The parsed value as SQL data type
 */
function toSqlValue(value: unknown): SqlValue {
    switch (true) {
        case isSqlValue(value):
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
                throw new TypeError(
                    `Unable to serialize value: ${error}`,
                )
            }
        default:
            throw new TypeError(
                `Unsupported literal type: ${value}`,
            )
    }
}

/**
 * SQL utility functions for type checking and string building.
 * Provides safe SQL fragment construction helpers.
 */
export const sql = {
    isIdentifier: (value: unknown): boolean => isIdentifier(value),
    needsQuoting: (value: string): boolean => needsQuoting(value),
    isSqlValue: (value: unknown): boolean => isSqlValue(value),
    toSqlValue: (value: unknown): SqlValue => toSqlValue(value),

    // join helpers
    and: (...parts: string[]) => parts.join(` ${SQL.AND} `),
    or: (...parts: string[]) => parts.join(` ${SQL.OR} `),
    dot: (...parts: string[]) => parts.join('.'),
    comma: (...parts: string[]) => parts.join(', '),
    group: (...parts: string[]) => `(${parts.join(' ')})`,
} as const
