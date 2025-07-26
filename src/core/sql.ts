import { SQL_KEYWORDS as SQL } from '~/core/sql-constants.ts'

/** Supported value types */
export type SqlValue = null | number | bigint | string | Uint8Array
export type SqlIdentifier = string

const SQL_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

function isIdentifier(token: unknown): token is SqlIdentifier {
    return typeof token === 'string' && SQL_IDENTIFIER_PATTERN.test(token)
}

function needsQuoting(token: string): boolean {
    return (
        !SQL_IDENTIFIER_PATTERN.test(token) ||
        token.toUpperCase() in SQL
    )
}

/**
 * Checks if a given value is a valid SQLite type
 * @param token The value to check for SQLite compatibility
 * @returns True if the value is a valid SQLite value type
 */
function isSqlValue(
    token: unknown,
): token is SqlValue {
    return (
        token === null ||
        typeof token === 'number' ||
        typeof token === 'bigint' ||
        typeof token === 'string' ||
        token instanceof Uint8Array
    )
}

/**
 * Casts values to supported types 🧼
 * @param token any input value
 * @returns input value as a supported type
 */
function toSqlValue(token: unknown): SqlValue {
    switch (true) {
        case isSqlValue(token):
            return token
        case token === undefined:
            return null
        case typeof token === 'boolean':
            return token ? 1 : 0
        case token instanceof Date:
            return token.toISOString()
        case Array.isArray(token) || typeof token === 'object':
            try {
                return JSON.stringify(token)
            } catch (error) {
                throw new TypeError(
                    `Unable to serialize value: ${error}`,
                )
            }
        default:
            throw new TypeError(
                `Unsupported literal type: ${token}`,
            )
    }
}

// Small SQL utils/safe-guards API
export const sql = {
    isIdentifier: (token: unknown) => isIdentifier(token),
    needsQuoting: (token: string) => needsQuoting(token),

    isSqlValue: (token: unknown) => isSqlValue(token),
    toSqlValue: (token: unknown) => toSqlValue(token),

    // join helpers
    and: (...parts: string[]) => parts.join(` ${SQL.AND} `),
    or: (...parts: string[]) => parts.join(` ${SQL.OR} `),
    dot: (...parts: string[]) => parts.join('.'),
    comma: (...parts: string[]) => parts.join(', '),
    parens: (...parts: string[]) => `(${parts.join(' ')})`,
} as const
