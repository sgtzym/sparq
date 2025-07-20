/**
 * Reserved SQL keywords based on SQL-92 standard
 * https://www.sqlite.org/lang_keywords.html
 */
const SQL_RESERVED_KEYWORDS = new Set(
    [
        'ABORT',
        'ACTION',
        'ADD',
        'AFTER',
        'ALL',
        'ALTER',
        'ALWAYS',
        'ANALYZE',
        'AND',
        'AS',
        'ASC',
        'ATTACH',
        'AUTOINCREMENT',
        'BEFORE',
        'BEGIN',
        'BETWEEN',
        'BY',
        'CASCADE',
        'CASE',
        'CAST',
        'CHECK',
        'COLLATE',
        'COLUMN',
        'COMMIT',
        'CONFLICT',
        'CONSTRAINT',
        'CREATE',
        'CROSS',
        'CURRENT',
        'CURRENT_DATE',
        'CURRENT_TIME',
        'CURRENT_TIMESTAMP',
        'DATABASE',
        'DEFAULT',
        'DEFERRABLE',
        'DEFERRED',
        'DELETE',
        'DESC',
        'DETACH',
        'DISTINCT',
        'DO',
        'DROP',
        'EACH',
        'ELSE',
        'END',
        'ESCAPE',
        'EXCEPT',
        'EXCLUDE',
        'EXCLUSIVE',
        'EXISTS',
        'EXPLAIN',
        'FAIL',
        'FILTER',
        'FIRST',
        'FOLLOWING',
        'FOR',
        'FOREIGN',
        'FROM',
        'FULL',
        'GENERATED',
        'GLOB',
        'GROUP',
        'GROUPS',
        'HAVING',
        'IF',
        'IGNORE',
        'IMMEDIATE',
        'IN',
        'INDEX',
        'INDEXED',
        'INITIALLY',
        'INNER',
        'INSERT',
        'INSTEAD',
        'INTERSECT',
        'INTO',
        'IS',
        'ISNULL',
        'JOIN',
        'KEY',
        'LAST',
        'LEFT',
        'LIKE',
        'LIMIT',
        'MATCH',
        'MATERIALIZED',
        'NATURAL',
        'NO',
        'NOT',
        'NOTHING',
        'NOTNULL',
        'NULL',
        'NULLS',
        'OF',
        'OFFSET',
        'ON',
        'OR',
        'ORDER',
        'OTHERS',
        'OUTER',
        'OVER',
        'PARTITION',
        'PLAN',
        'PRAGMA',
        'PRECEDING',
        'PRIMARY',
        'QUERY',
        'RAISE',
        'RANGE',
        'RECURSIVE',
        'REFERENCES',
        'REGEXP',
        'REINDEX',
        'RELEASE',
        'RENAME',
        'REPLACE',
        'RESTRICT',
        'RETURNING',
        'RIGHT',
        'ROLLBACK',
        'ROW',
        'ROWS',
        'SAVEPOINT',
        'SELECT',
        'SET',
        'TABLE',
        'TEMP',
        'TEMPORARY',
        'THEN',
        'TIES',
        'TO',
        'TRANSACTION',
        'TRIGGER',
        'UNBOUNDED',
        'UNION',
        'UNIQUE',
        'UPDATE',
        'USING',
        'VACUUM',
        'VALUES',
        'VIEW',
        'VIRTUAL',
        'WHEN',
        'WHERE',
        'WINDOW',
        'WITH',
        'WITHOUT',
    ],
)

// Supported value types
type SqlValue = null | number | bigint | string | Uint8Array
type SqlIdentifier = string

const SQL_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * @param arg
 * @returns
 */
function isIdentifier(arg: unknown): arg is SqlIdentifier {
    if (!arg || typeof arg !== 'string') return false
    if (!SQL_IDENTIFIER_PATTERN.test(arg)) return false
    return true
}

/**
 * @param part
 * @returns
 */
function needsQuoting(token: string): boolean {
    return (
        !SQL_IDENTIFIER_PATTERN.test(token) ||
        SQL_RESERVED_KEYWORDS.has(token.toUpperCase())
    )
}

/**
 * Checks if a given value is a valid SQLite type
 * @param value The value to check for SQLite compatibility
 * @returns True if the value is a valid SQLite value type
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
 * Casts values to supported types 🧼
 * @param value any input value
 * @returns input value as a supported type
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

export {
    isIdentifier,
    isSqlValue,
    needsQuoting,
    type SqlIdentifier,
    type SqlValue,
    toSqlValue,
}
