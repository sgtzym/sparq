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
 * @param column - The column to average (optional, defaults to *)
 * @returns A SQL function node that calculates the average
 *
 * @example
 * ```ts
 * avg(user.age)           // AVG(user.age)
 * avg(order.total)        // AVG(order.total)
 * avg()                   // AVG(*) - average of all numeric columns
 * ```
 */
export const avg = aggregate(sql('AVG'))

/**
 * Counts the number of rows or non-null values.
 * Use this to get the total number of records or non-empty values.
 *
 * @param column - The column to count (optional, defaults to *)
 * @returns A SQL function node that counts rows
 *
 * @example
 * ```ts
 * count(user.id)          // COUNT(user.id) - count non-null IDs
 * count()                 // COUNT(*) - count all rows
 * count(user.email)       // COUNT(user.email) - count users with email
 * ```
 */
export const count = aggregate(sql('COUNT'))

/**
 * Finds the maximum value in a column.
 * Use this to get the largest value across all rows in a group.
 *
 * @param column - The column to find the maximum of (optional, defaults to *)
 * @returns A SQL function node that finds the maximum
 *
 * @example
 * ```ts
 * max(user.score)         // MAX(user.score)
 * max(order.total)        // MAX(order.total)
 * max(product.price)      // MAX(product.price)
 * ```
 */
export const max = aggregate(sql('MAX'))

/**
 * Finds the minimum value in a column.
 * Use this to get the smallest value across all rows in a group.
 *
 * @param column - The column to find the minimum of (optional, defaults to *)
 * @returns A SQL function node that finds the minimum
 *
 * @example
 * ```ts
 * min(user.score)         // MIN(user.score)
 * min(order.total)        // MIN(order.total)
 * min(product.price)      // MIN(product.price)
 * ```
 */
export const min = aggregate(sql('MIN'))

/**
 * Calculates the sum of values in a numeric column.
 * Use this to get the total of all values across rows in a group.
 *
 * @param column - The column to sum (optional, defaults to *)
 * @returns A SQL function node that calculates the sum
 *
 * @example
 * ```ts
 * sum(order.total)        // SUM(order.total)
 * sum(product.stock)      // SUM(product.stock)
 * sum(user.points)        // SUM(user.points)
 * ```
 */
export const sum = aggregate(sql('SUM'))

// → String functions (require args)

/**
 * Converts text to uppercase letters.
 * Use this to standardize text case or for case-insensitive comparisons.
 *
 * @param args - The text expressions to convert
 * @returns A SQL function node that converts to uppercase
 *
 * @example
 * ```ts
 * upper(user.name)        // UPPER(user.name)
 * upper(product.code)     // UPPER(product.code)
 * ```
 */
export const upper = fn(sql('UPPER'))

/**
 * Converts text to lowercase letters.
 * Use this to standardize text case or for case-insensitive comparisons.
 *
 * @param args - The text expressions to convert
 * @returns A SQL function node that converts to lowercase
 *
 * @example
 * ```ts
 * lower(user.email)       // LOWER(user.email)
 * lower(category.name)    // LOWER(category.name)
 * ```
 */
export const lower = fn(sql('LOWER'))

/**
 * Gets the character length of a text value.
 * Use this to measure string lengths or filter by text size.
 *
 * @param args - The text expressions to measure
 * @returns A SQL function node that returns the character count
 *
 * @example
 * ```ts
 * length(user.bio)        // LENGTH(user.bio)
 * length(product.description)  // LENGTH(product.description)
 *
 * // Filter by text length
 * users.select().where(length(user.password).ge(8))
 * ```
 */
export const length = fn(sql('LENGTH'))

/**
 * Removes leading and trailing whitespace from text.
 * Use this to clean up user input or normalize text data.
 *
 * @param args - The text expressions to trim
 * @returns A SQL function node that removes whitespace
 *
 * @example
 * ```ts
 * trim(user.name)         // TRIM(user.name)
 * trim(product.title)     // TRIM(product.title)
 *
 * // Clean user input during insert
 * users.insert('name').values(trim('  John Doe  '))
 * ```
 */
export const trim = fn(sql('TRIM'))

/**
 * Removes leading (left) whitespace from text.
 * Use this to clean up text that may have extra spaces at the beginning.
 *
 * @param args - The text expressions to trim
 * @returns A SQL function node that removes leading whitespace
 *
 * @example
 * ```ts
 * ltrim(user.description)     // LTRIM(user.description)
 * ltrim(comment.content)      // LTRIM(comment.content)
 * ```
 */
export const ltrim = fn(sql('LTRIM'))

/**
 * Removes trailing (right) whitespace from text.
 * Use this to clean up text that may have extra spaces at the end.
 *
 * @param args - The text expressions to trim
 * @returns A SQL function node that removes trailing whitespace
 *
 * @example
 * ```ts
 * rtrim(user.notes)       // RTRIM(user.notes)
 * rtrim(address.street)   // RTRIM(address.street)
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
 * substr(user.name, 1, 5)     // SUBSTR(user.name, 1, 5) - first 5 chars
 * substr(product.code, 4)     // SUBSTR(product.code, 4) - from 4th char to end
 *
 * // Get first 50 characters for preview
 * users.select(substr(user.bio, 1, 50).as('bio_preview'))
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
 * replace(user.phone, '-', '')        // REPLACE(user.phone, '-', '') - remove dashes
 * replace(product.name, '&', 'and')   // REPLACE(product.name, '&', 'and')
 *
 * // Clean phone numbers
 * users.select(replace(replace(user.phone, '-', ''), ' ', '').as('clean_phone'))
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
 * instr(user.email, '@')              // INSTR(user.email, '@') - find @ position
 * instr(product.description, 'sale')  // INSTR(product.description, 'sale')
 *
 * // Find users with gmail addresses
 * users.select().where(instr(user.email, '@gmail.com').gt(0))
 * ```
 */
export const instr = fn(sql('INSTR'))

// → Date/Time functions

/**
 * Extracts the date part from a datetime value.
 * Use this to work with dates without time components.
 *
 * @param args - The datetime expressions to convert
 * @returns A SQL function node that returns the date
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
 * @param args - The datetime expressions to convert
 * @returns A SQL function node that returns the time
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
 * @param args - The expressions to convert to datetime
 * @returns A SQL function node that returns a datetime
 *
 * @example
 * ```ts
 * dateTime('2024-01-01 12:00:00')     // DATETIME('2024-01-01 12:00:00')
 * dateTime(user.createdAt)            // DATETIME(user.createdAt)
 * ```
 */
export const dateTime = fn(sql('DATETIME'))

/**
 * Formats a datetime using a format string.
 * Use this to display dates in custom formats.
 *
 * @param args - The format string and datetime expression
 * @returns A SQL function node that formats the datetime
 *
 * @example
 * ```ts
 * strftime('%Y-%m-%d', user.createdAt)    // STRFTIME('%Y-%m-%d', user.createdAt)
 * strftime('%B %d, %Y', order.date)       // STRFTIME('%B %d, %Y', order.date)
 *
 * // Common format patterns:
 * strftime('%Y', user.createdAt)          // Year: '2024'
 * strftime('%m', user.createdAt)          // Month: '01'
 * strftime('%d', user.createdAt)          // Day: '15'
 * strftime('%H:%M', user.createdAt)       // Time: '14:30'
 * ```
 */
export const strftime = fn(sql('STRFTIME'))

/**
 * Converts a datetime to Julian day number.
 * Use this for date arithmetic and calculations.
 *
 * @param args - The datetime expressions to convert
 * @returns A SQL function node that returns the Julian day
 *
 * @example
 * ```ts
 * julianday(user.birthDate)       // JULIANDAY(user.birthDate)
 *
 * // Calculate age in days
 * users.select(
 *   user.name,
 *   sub(julianday('now'), julianday(user.birthDate)).as('age_in_days')
 * )
 * ```
 */
export const julianday = fn(sql('JULIANDAY'))

// → Math functions

/**
 * Returns the absolute value of a number.
 * Use this to get positive values regardless of sign.
 *
 * @param args - The numeric expressions to make absolute
 * @returns A SQL function node that returns the absolute value
 *
 * @example
 * ```ts
 * abs(user.balance)           // ABS(user.balance)
 * abs(order.adjustment)       // ABS(order.adjustment)
 *
 * // Find all balance changes regardless of direction
 * transactions.select().where(abs(transaction.amount).gt(100))
 * ```
 */
export const abs = fn(sql('ABS'))

/**
 * Rounds a number to the specified decimal places.
 * Use this to format numbers for display or calculations.
 *
 * @param args - The number and optional decimal places
 * @returns A SQL function node that rounds the number
 *
 * @example
 * ```ts
 * round(user.score, 2)        // ROUND(user.score, 2)
 * round(product.price)        // ROUND(product.price) - rounds to integer
 *
 * // Round prices to nearest cent
 * products.select(product.name, round(product.price, 2).as('display_price'))
 * ```
 */
export const round = fn(sql('ROUND'))

/**
 * Rounds a number up to the nearest integer.
 * Use this when you need to round up regardless of decimal value.
 *
 * @param args - The numeric expressions to round up
 * @returns A SQL function node that rounds up
 *
 * @example
 * ```ts
 * ceil(user.rating)           // CEIL(user.rating)
 * ceil(order.tax)             // CEIL(order.tax)
 *
 * // Calculate minimum pages needed
 * books.select(book.title, ceil(div(book.word_count, 250)).as('min_pages'))
 * ```
 */
export const ceil = fn(sql('CEIL'))

/**
 * Rounds a number down to the nearest integer.
 * Use this when you need to round down regardless of decimal value.
 *
 * @param args - The numeric expressions to round down
 * @returns A SQL function node that rounds down
 *
 * @example
 * ```ts
 * floor(user.average)         // FLOOR(user.average)
 * floor(product.discount)     // FLOOR(product.discount)
 *
 * // Get whole dollar amounts
 * orders.select(order.id, floor(order.total).as('whole_dollars'))
 * ```
 */
export const floor = fn(sql('FLOOR'))

/**
 * Returns the remainder after division (modulo operation).
 * Use this for cyclic calculations or grouping by patterns.
 *
 * @param args - The dividend and divisor
 * @returns A SQL function node that returns the remainder
 *
 * @example
 * ```ts
 * mod(user.id, 10)            // MOD(user.id, 10)
 * mod(order.number, 100)      // MOD(order.number, 100)
 *
 * // Find even/odd records
 * users.select().where(mod(user.id, 2).eq(0))  // Even IDs
 * users.select().where(mod(user.id, 2).eq(1))  // Odd IDs
 * ```
 */
export const mod = fn(sql('MOD'))

/**
 * Raises a number to the specified power.
 * Use this for exponential calculations and mathematical operations.
 *
 * @param args - The base and exponent
 * @returns A SQL function node that calculates the power
 *
 * @example
 * ```ts
 * pow(user.level, 2)          // POWER(user.level, 2) - square the level
 * pow(2, user.rank)           // POWER(2, user.rank) - 2 to the rank power
 *
 * // Calculate compound interest
 * accounts.select(
 *   account.balance,
 *   mul(account.balance, pow(1.05, account.years)).as('future_value')
 * )
 * ```
 */
export const pow = fn(sql('POWER'))

/**
 * Calculates the square root of a number.
 * Use this for geometric calculations and statistical operations.
 *
 * @param args - The numeric expressions to calculate square root for
 * @returns A SQL function node that returns the square root
 *
 * @example
 * ```ts
 * sqrt(user.area)             // SQRT(user.area)
 * sqrt(product.dimension)     // SQRT(product.dimension)
 *
 * // Calculate distance using Pythagorean theorem
 * locations.select(
 *   location.name,
 *   sqrt(add(pow(location.x, 2), pow(location.y, 2))).as('distance_from_origin')
 * )
 * ```
 */
export const sqrt = fn(sql('SQRT'))

/**
 * Generates a random number.
 * Use this for sampling, testing, or generating random data.
 *
 * @param args - No arguments needed
 * @returns A SQL function node that returns a random number
 *
 * @example
 * ```ts
 * random()                    // RANDOM()
 *
 * // Get random sample of users
 * users.select().orderBy(random()).limit(10)
 *
 * // Generate random IDs
 * users.select(user.name, abs(mod(random(), 1000)).as('random_id'))
 * ```
 */
export const random = fn(sql('RANDOM'))
