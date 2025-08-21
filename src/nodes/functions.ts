import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Functions
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a SQL function call with arguments.
 * Used for both built-in SQLite functions and aggregate operations.
 */
export class FnNode extends SqlNode {
    constructor(
        private readonly name: SqlNode,
        private readonly expr: ArrayLike<SqlNode>,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _name: string = this.name.render(params)
        const _expr: string = renderSqlNodes(this.expr, params).join(', ')

        return `${_name}(${_expr ?? ''})`
    }
}

// -> 🏭 Factories

/**
 * Creates a function factory.
 * @param name - The fn name
 * @param args - The expression arguments
 * @returns A function that creates fn nodes
 */
const fn = (name: string) => (...args: SqlNodeValue[]) =>
    new FnNode(raw(name), args.map(expr))

// → Aggregate functions

/**
 * Creates an aggregate function factory.
 * @param name - The fn name
 * @param column - The column name, defaults to * if empty
 * @returns A function that creates aggregate nodes
 */
const aggregate = (name: string) => (column?: SqlNodeValue) =>
    new FnNode(raw(name), column ? expr(column) : raw('*'))

/**
 * Calculates the average value of a numeric column.
 * Use this to find the mean value across all rows in a group.
 *
 * @example
 * ```ts
 * avg(user.age) // AVG(user.age)
 * avg()         // AVG(*) - average of all numeric columns
 * ```
 */
export const avg = aggregate(sql('AVG'))

/**
 * Counts the number of rows or non-null values.
 * Use this to get the total number of records or non-empty values.
 *
 * @example
 * ```ts
 * count(user.id) // COUNT(user.id) - count non-null IDs
 * count()        // COUNT(*) - count all rows
 * ```
 */
export const count = aggregate(sql('COUNT'))

/**
 * Finds the maximum value in a column.
 * Use this to get the largest value across all rows in a group.
 *
 * @example
 * ```ts
 * max(user.score) // MAX(user.score)
 * ```
 */
export const max = aggregate(sql('MAX'))

/**
 * Finds the minimum value in a column.
 * Use this to get the smallest value across all rows in a group.
 *
 * @example
 * ```ts
 * min(user.score) // MIN(user.score)
 * ```
 */
export const min = aggregate(sql('MIN'))

/**
 * Calculates the sum of values in a numeric column.
 * Use this to get the total of all values across rows in a group.
 *
 * @example
 * ```ts
 * sum(order.total) // SUM(order.total)
 * ```
 */
export const sum = aggregate(sql('SUM'))

// → String functions (require args)

/**
 * Converts text to uppercase letters.
 * Use this to standardize text case or for case-insensitive comparisons.
 *
 * @example
 * ```ts
 * upper(user.name) // UPPER(user.name)
 * ```
 */
export const upper = fn(sql('UPPER'))

/**
 * Converts text to lowercase letters.
 * Use this to standardize text case or for case-insensitive comparisons.
 *
 * @example
 * ```ts
 * lower(user.email) // LOWER(user.email)
 * ```
 */
export const lower = fn(sql('LOWER'))

/**
 * Gets the character length of a text value.
 * Use this to measure string lengths or filter by text size.
 *
 * @example
 * ```ts
 * length(user.bio) // LENGTH(user.bio)
 *
 * // Filter by text length
 * // SELECT * FROM user WHERE LENGTH(user.password) > 8
 * users.select().where(length(user.password).ge(8))
 * ```
 */
export const length = fn(sql('LENGTH'))

/**
 * Removes leading and trailing whitespace from text.
 * Use this to clean up user input or normalize text data.
 *
 * @example
 * ```ts
 * trim(user.name) // TRIM(user.name)
 * ```
 */
export const trim = fn(sql('TRIM'))

/**
 * Removes leading (left) whitespace from text.
 * Use this to clean up text that may have extra spaces at the beginning.
 *
 * @example
 * ```ts
 * ltrim(user.description) // LTRIM(user.description)
 * ```
 */
export const ltrim = fn(sql('LTRIM'))

/**
 * Removes trailing (right) whitespace from text.
 * Use this to clean up text that may have extra spaces at the end.
 *
 * @example
 * ```ts
 * rtrim(user.notes) // RTRIM(user.notes)
 * ```
 */
export const rtrim = fn(sql('RTRIM'))

/**
 * Extracts a substring from text.
 * Use this to get portions of text or truncate long strings.
 *
 * @param args - The text, start position, and optional length
 * @returns A SQL function node that extracts a substring
 *
 * @example
 * ```ts
 * substr(user.name, 1, 5) // SUBSTR(user.name, 1, 5) - first 5 chars
 * substr(product.code, 4) // SUBSTR(product.code, 4) - from 4th char to end
 *
 * // Get first 50 characters for preview
 * user.select(substr(user.bio, 1, 50).as('bio_preview'))
 * ```
 */
export const substr = fn(sql('SUBSTR'))

/**
 * Replaces occurrences of text within a string.
 * Use this to clean data, fix formatting, or standardize values.
 *
 * @param args - The text, search pattern, and replacement text
 * @returns A SQL function node that replaces text
 *
 * @example
 * ```ts
 * replace(product.name, '&', 'and') // REPLACE(product.name, '&', 'and')
 * ```
 */
export const replace = fn(sql('REPLACE'))

/**
 * Finds the position of a substring within text.
 * Use this to locate text patterns or check if text contains specific content.
 *
 * @param args - The text to search and the substring to find
 * @returns A SQL function node that returns the position (0 if not found)
 *
 * @example
 * ```ts
 * instr(user.email, '@') // INSTR(user.email, '@') - find @ position
 * ```
 */
export const instr = fn(sql('INSTR'))

// → Date/Time functions

/**
 * Extracts the date part from a datetime value.
 * Use this to work with dates without time components.
 *
 * @example
 * ```ts
 * date(user.createdAt)        // DATE(user.createdAt)
 * date('2024-01-15 14:30:00') // DATE('2024-01-15 14:30:00') -> '2024-01-15'
 *
 * // Group orders by date
 * orders.select(date(order.createdAt), count())
 *   .groupBy(date(order.createdAt))
 * ```
 */
export const date = fn(sql('DATE'))

/**
 * Extracts the time part from a datetime value.
 * Use this to work with times without date components.
 *
 * @example
 * ```ts
 * time(user.loginAt)          // TIME(user.loginAt)
 * time('2024-01-15 14:30:00') // TIME('2024-01-15 14:30:00') -> '14:30:00'
 *
 * // Find late logins
 * users.select().where(time(user.lastLogin).gt('18:00:00'))
 * ```
 */
export const time = fn(sql('TIME'))

/**
 * Converts a value to datetime format.
 * Use this to ensure consistent datetime formatting.
 *
 * @example
 * ```ts
 * dateTime('2024-01-01 12:00:00') // DATETIME('2024-01-01 12:00:00')
 * dateTime(user.createdAt)        // DATETIME(user.createdAt)
 * ```
 */
export const dateTime = fn(sql('DATETIME'))

/**
 * Formats a datetime using a format string.
 * Use this to display dates in custom formats.
 *
 * @example
 * ```ts
 * strftime('%Y-%m-%d', user.createdAt) // STRFTIME('%Y-%m-%d', user.createdAt)
 * strftime('%B %d, %Y', order.date)    // STRFTIME('%B %d, %Y', order.date)
 *
 * // Common format patterns:
 * strftime('%Y', user.createdAt)    // Year: '2024'
 * strftime('%m', user.createdAt)    // Month: '01'
 * strftime('%d', user.createdAt)    // Day: '15'
 * strftime('%H:%M', user.createdAt) // Time: '14:30'
 * ```
 */
export const strftime = fn(sql('STRFTIME'))

/**
 * Converts a datetime to Julian day number.
 * Use this for date arithmetic and calculations.
 *
 * @example
 * ```ts
 * julianday(user.birthDate) // JULIANDAY(user.birthDate)
 * ```
 */
export const julianday = fn(sql('JULIANDAY'))

// → Math functions

/**
 * Returns the absolute value of a number.
 * Use this to get positive values regardless of sign.
 *
 * @example
 * ```ts
 * abs(user.balance) // ABS(user.balance)
 *
 * // Find all balance changes regardless of direction
 * transactions.select().where(gt(abs(transaction.amount), 100))
 * ```
 */
export const abs = fn(sql('ABS'))

/**
 * Rounds a number to the specified decimal places.
 * Use this to format numbers for display or calculations.
 *
 * @example
 * ```ts
 * round(user.score, 2) // ROUND(user.score, 2)
 * round(product.price) // ROUND(product.price) - rounds to integer
 *
 * // Round prices to nearest cent
 * products.select(product.name, alias(round(product.price, 2), 'display_price'))
 * ```
 */
export const round = fn(sql('ROUND'))

/**
 * Rounds a number up to the nearest integer.
 * Use this when you need to round up regardless of decimal value.
 *
 * @example
 * ```ts
 * ceil(user.rating) // CEIL(user.rating)
 *
 * // Calculate minimum pages needed
 * books.select(book.title, alias(ceil(div(book.word_count, 250)), 'min_pages'))
 * ```
 */
export const ceil = fn(sql('CEIL'))

/**
 * Rounds a number down to the nearest integer.
 * Use this when you need to round down regardless of decimal value.
 *
 * @example
 * ```ts
 * floor(user.average) // FLOOR(user.average)
 *
 * // Get whole dollar amounts
 * orders.select(order.id, alias(floor(order.total), 'whole_dollars'))
 * ```
 */
export const floor = fn(sql('FLOOR'))

/**
 * Returns the remainder after division (modulo operation).
 * Use this for cyclic calculations or grouping by patterns.
 *
 * @example
 * ```ts
 * mod(user.id, 10) // MOD(user.id, 10)
 *
 * // Find even/odd records
 * users.select().where(eq(mod(user.id, 2), 0)) // Even IDs
 * users.select().where(eq(mod(user.id, 2), 1)) // Odd IDs
 * ```
 */
export const mod = fn(sql('MOD'))

/**
 * Raises a number to the specified power.
 * Use this for exponential calculations and mathematical operations.
 *
 * @example
 * ```ts
 * pow(user.level, 2) // POWER(user.level, 2) - square the level
 * pow(2, user.rank)  // POWER(2, user.rank) - 2 to the rank power
 *
 * // Calculate compound interest
 * accounts.select(
 *   account.balance,
 *   alias(mul(account.balance, pow(1.05, account.years)), 'future_value')
 * )
 * ```
 */
export const pow = fn(sql('POWER'))

/**
 * Calculates the square root of a number.
 * Use this for geometric calculations and statistical operations.
 *
 * @example
 * ```ts
 * sqrt(user.area) // SQRT(user.area)
 *
 * // Calculate distance using Pythagorean theorem
 * locations.select(
 *   location.name,
 *   alias(sqrt(add(pow(location.x, 2), pow(location.y, 2))), 'distance_from_origin')
 * )
 * ```
 */
export const sqrt = fn(sql('SQRT'))

/**
 * Generates a random number.
 * Use this for sampling, testing, or generating random data.
 *
 * @example
 * ```ts
 * random() // RANDOM()
 *
 * // Get random sample of users
 * users.select().orderBy(random()).limit(10)
 *
 * // Generate random IDs
 * users.select(user.name, alias(abs(mod(random(), 1000)), 'random_id'))
 * ```
 */
export const random = fn(sql('RANDOM'))
