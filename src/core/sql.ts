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
 * Checks if an identifier needs to be quoted in SQL.
 * Identifiers need quoting if they contain special characters or are reserved keywords.
 *
 * @param value - The identifier to check
 * @returns True if the identifier needs quoting with double quotes
 *
 * @example
 * ```ts
 * needsQuoting('user')        // false (valid identifier)
 * needsQuoting('user-id')     // true (contains dash)
 * needsQuoting('SELECT')      // true (reserved keyword)
 * needsQuoting('123column')   // true (starts with number)
 * ```
 */
export function needsQuoting(value: string): boolean {
    if (typeof value !== 'string') return false

    return !SQL_NAME_PATTERN.test(value) || isSqlKeyword(value)
}

/**
 * Checks if a value is a reserved SQL keyword.
 * Use this to determine if an identifier conflicts with SQL syntax.
 *
 * @param value - The value to check (case-insensitive)
 * @returns True if the value is a reserved keyword
 *
 * @example
 * ```ts
 * isSqlKeyword('SELECT')  // true
 * isSqlKeyword('select')  // true (case-insensitive)
 * isSqlKeyword('user')    // false
 * isSqlKeyword('COUNT')   // true (function name)
 * ```
 */
export function isSqlKeyword(value: string): boolean {
    return value.toUpperCase() in SQL_KEYWORDS
}

/**
 * Checks if a value is a valid SQL data type that can be parameterized.
 * Use this to validate values before adding them to parameter lists.
 *
 * @param value - The value to check
 * @returns True if the value is a valid SQL data type
 *
 * @example
 * ```ts
 * isSqlDataType('hello')      // true (string)
 * isSqlDataType(123)          // true (number)
 * isSqlDataType(null)         // true (null)
 * isSqlDataType(new Date())   // false (needs conversion)
 * isSqlDataType(undefined)    // false (needs conversion)
 * ```
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
 * Converts any value to a valid SQL data type for parameterization.
 * Handles type conversion and serialization for complex types.
 *
 * @param value - The value to convert
 * @returns The value as a SQL-compatible data type
 * @throws TypeError if the value cannot be serialized
 *
 * @example
 * ```ts
 * toSqlDataType(true)           // 1 (SQLite uses integers for booleans)
 * toSqlDataType(false)          // 0
 * toSqlDataType(new Date())     // "2024-01-01T12:00:00.000Z" (ISO string)
 * toSqlDataType(undefined)      // null (converts undefined to null)
 * toSqlDataType({key: 'val'})   // '{"key":"val"}' (JSON string)
 * toSqlDataType([1, 2, 3])      // '[1,2,3]' (JSON string)
 * ```
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
 * Creates a SQL snippet from keywords and strings with proper spacing.
 * Automatically handles word separation and filters out empty values.
 *
 * @param parts - The SQL keywords or strings to join
 * @returns A properly formatted SQL string with correct spacing
 *
 * @example
 * ```ts
 * sql('SELECT', 'FROM', 'users')           // "SELECT FROM users"
 * sql('ORDER BY', 'name', 'ASC')          // "ORDER BY name ASC"
 * sql('WHERE', '', 'active = 1')          // "WHERE active = 1" (empty filtered)
 * sql('SELECT COUNT(*) FROM table')       // "SELECT COUNT(*) FROM table"
 * ```
 */
export function sql(...parts: SqlSnippet[]): string {
    return parts
        .flatMap((p) => typeof p === 'string' ? p.split(' ') : p)
        .filter(Boolean)
        .join(' ')
}
