import { needsQuoting } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { SqlNode, type SqlParam } from '~/core/sql-node.ts'
import { expr, id } from '~/nodes/primitives.ts'
import * as ex from '~/nodes/expressions.ts'
import * as fn from '~/nodes/functions.ts'
import { assign, valueList } from '~/nodes/values.ts'

/**
 * Union type for values that can be used in column operations.
 */
type ColumnValue<TType extends SqlParam = SqlParam> = any

/**
 * Base interface for all column types with common SQL operations.
 */
export interface IColumn<
    TName extends string = string,
    TType extends SqlParam = SqlParam,
> {
    /**
     * Returns distinct values only.
     *
     * @example
     * ```ts
     * // DISTINCT user.city
     * user.city.distinct()
     * ```
     */
    distinct(): this

    /**
     * Returns all values.
     *
     * @example
     * ```ts
     * // ALL user.city
     * user.city.all()
     * ```
     */
    all(): this

    /**
     * Equals (=).
     *
     * @example
     * ```ts
     * // user.name = 'John'
     * user.name.eq('John')
     * ```
     */
    eq(arg: ColumnValue<TType>): SqlNode

    /**
     * Not equal to (!=).
     *
     * @example
     * ```ts
     * // user.name != 'John'
     * user.name.ne('John')
     * ```
     */
    ne(arg: ColumnValue<TType>): SqlNode

    /**
     * Membership in set.
     *
     * @example
     * ```ts
     * // user.role IN ('admin', 'moderator')
     * user.role.in(['admin', 'moderator'])
     */
    in(args: TType[]): SqlNode

    /**
     * Is null.
     *
     * @example
     * ```ts
     * // user.deletedAt IS NULL
     * user.deletedAt.isNull()
     * ```
     */
    isNull(): SqlNode

    /**
     * Is not null.
     *
     * @example
     * ```ts
     * // user.email IS NOT NULL
     * user.email.isNotNull()
     * ```
     */
    isNotNull(): SqlNode

    /**
     * Aliases (AS).
     * @param asName - The alias name
     *
     * @example
     * ```ts
     * // user.firstName AS name
     * user.firstName.as('name')
     * ```
     */
    as(asName: ColumnValue<string>): SqlNode

    /**
     * Assigns a value.
     *
     * @example
     * ```ts
     * // user.name = 'John'
     * user.name.to('John')
     * ```
     */
    to(value: ColumnValue<TType>): SqlNode

    /**
     * Sorts in ascending order.
     *
     * @example
     * ```ts
     * // user.name ASC
     * user.name.asc()
     * ```
     */
    asc(): SqlNode

    /**
     * Sorts in descending order.
     * @example
     * ```ts
     * // user.createdAt DESC
     * user.createdAt.desc()
     * ```
     */
    desc(): SqlNode

    /**
     * Counts non-null value rows.
     *
     * @example
     * ```ts
     * // COUNT(user.email)
     * user.email.count()
     * ```
     */
    count(): this

    /**
     * Finds maximum value.
     *
     * @example
     * ```ts
     * // MAX(user.score)
     * user.score.max()
     * ```
     */
    max(): this

    /**
     * Finds minimum value.
     *
     * @example
     * ```ts
     * // MIN(user.score)
     * user.score.min()
     * ```
     */
    min(): this
}

export interface INumberColumn<TName extends string = string>
    extends IColumn<TName, number> {
    /**
     * Greater than (>).
     * @example
     * ```ts
     * // user.age > 18
     * user.age.gt(18)
     */
    gt(value: ColumnValue<number>): SqlNode

    /**
     * Less than (>).
     *
     * @example
     * ```ts
     * // user.age < 18
     * user.age.lt(18)
     * ```
     */
    lt(value: ColumnValue<number>): SqlNode

    /**
     * Greater than or equal to (>=).
     *
     * @example
     * // user.score >= 100
     * user.score.ge(100)
     */
    ge(value: ColumnValue<number>): SqlNode

    /**
     * Less than or equal to (<=).
     *
     * @example
     * // user.score <= 100
     * user.score.le(100)
     */
    le(value: ColumnValue<number>): SqlNode

    /**
     * Within range (a – b).
     *
     * @example
     * ```ts
     * // user.age BETWEEN 18 AND 65
     * user.age.between(18, 65)
     */
    between(lower: ColumnValue<number>, upper: ColumnValue<number>): SqlNode

    /**
     * Adds the value (+).
     *
     * @example
     * ```ts
     * // user.score + 1000
     * user.score.add(1000)
     * ```
     */
    add(value: ColumnValue<number>): this

    /**
     * Subtracts the value (`-`).
     *
     * @example
     * ```ts
     * // user.score - 1000
     * user.score.sub(1000)
     * ```
     */
    sub(value: ColumnValue<number>): this

    /**
     * Multiplies by the value (`*`)
     *
     * @example
     * ```ts
     * // user.score * 1.1
     * user.score.mul(1.1)
     * ```
     */
    mul(value: ColumnValue<number>): this

    /**
     * Divides by the value (`/`)
     *
     * @example
     * ```ts
     * // user.score / 2
     * user.score.div(2)
     * ```
     */
    div(value: ColumnValue<number>): this

    /**
     * Returns the absolute value.
     *
     * @example
     * ```ts
     * // ABS(user.balance)
     * user.balance.abs()
     * ```
     */
    abs(): this

    /**
     * Returns to decimal places.
     *
     * @example
     * ```ts
     * // ROUND(user.rating, 2)
     * user.rating.round(2)
     * ```
     */
    round(decimals?: ColumnValue<number>): this

    /**
     * Returns up to nearest integer.
     *
     * @example
     * ```ts
     * // CEIL(user.rating)
     * user.rating.ceil()
     * ```
     */
    ceil(): this

    /**
     * Returns down to nearest integer.
     *
     * @example
     * ```ts
     * // FLOOR(user.rating)
     * user.rating.floor()
     * ```
     */
    floor(): this

    /**
     * Returns the square root.
     *
     * @example
     * ```ts
     * // SQRT(user.area)
     * user.area.sqrt()
     * ```
     */
    sqrt(): this

    /**
     * Returns the remainder after division (modulo).
     *
     * @example
     * ```ts
     * // MOD(user.id, 10)
     * user.id.mod(10)
     * ```
     */
    mod(divisor: ColumnValue<number>): this

    /**
     * Raises to the specified power.
     *
     * @example
     * ```ts
     * // POWER(user.level, 2)
     * user.level.pow(2)
     * ```
     */
    pow(exponent: ColumnValue<number>): this

    /**
     * Calculates percentage of a total.
     *
     * @example
     * ```ts
     * // user.score / 1000 * 100
     * user.score.percent(1000)
     * ```
     */
    percent(total: ColumnValue<number>): this

    /**
     * Calculates the average value.
     *
     * @example
     * ```ts
     * // AVG(user.score)
     * user.score.avg()
     * ```
     */
    avg(): this

    /**
     * Calculates the sum of values.
     *
     * @example
     * ```ts
     * // SUM(order.total)
     * order.total.sum()
     * ```
     */
    sum(): this
}

export interface ITextColumn<TName extends string = string>
    extends IColumn<TName, string> {
    /**
     * Matches pattern using wildcards.
     * Case-insensitive. Uses % (any characters) and _ (single character).
     *
     * @example
     * ```ts
     * // user.name LIKE '%John%'
     * user.name.like('%John%')
     * ```
     */
    like(pattern: ColumnValue<string>): SqlNode

    /**
     * Matches Unix file glob pattern.
     * Case-sensitive. Uses * (any characters), ? (single character), and [...] (character ranges).
     *
     * @example
     * ```ts
     * // user.email GLOB '*@gmail.com'
     * user.email.glob('*@gmail.com')
     */
    glob(pattern: ColumnValue<string>): SqlNode

    /**
     * Starts with the specified prefix.
     *
     * @example
     * ```ts
     * // user.name LIKE 'John%'
     * user.name.startsWith('John')
     * ```
     */
    startsWith(prefix: ColumnValue<string>): SqlNode

    /**
     * Ends with the specified suffix.
     *
     * @example
     * ```ts
     * // user.email LIKE '%@gmail.com'
     * user.email.endsWith('@gmail.com')
     * ```
     */
    endsWith(suffix: ColumnValue<string>): SqlNode

    /**
     * Contains the specified substring.
     *
     * @example
     * ```ts
     * // user.bio LIKE '%developer%'
     * user.bio.contains('developer')
     * ```
     */
    contains(substring: ColumnValue<string>): SqlNode

    /**
     * Converts to uppercase.
     *
     * @example
     * ```ts
     * // UPPER(user.name)
     * user.name.upper()
     * ```
     */
    upper(): this

    /**
     * Converts to lowercase.
     *
     * @example
     * ```ts
     * // LOWER(user.email)
     * user.email.lower()
     * ```
     */
    lower(): this

    /**
     * Returns the character count.
     *
     * @example
     * ```ts
     * // LENGTH(user.bio)
     * user.bio.length()
     * ```
     */
    length(): this

    /**
     * Removes leading and trailing whitespace.
     *
     * @example
     * ```ts
     * // TRIM(user.name)
     * user.name.trim()
     * ```
     */
    trim(): this

    /**
     * Removes leading whitespace.
     *
     * @example
     * ```ts
     * // LTRIM(user.description)
     * user.description.ltrim()
     * ```
     */
    ltrim(): this

    /**
     * Removes trailing whitespace.
     *
     * @example
     * ```ts
     * // RTRIM(user.notes)
     * user.notes.rtrim()
     * ```
     */
    rtrim(): this

    /**
     * Extracts a substring.
     *
     * @example
     * ```ts
     * // SUBSTR(user.name, 1, 5)
     * user.name.substr(1, 5)
     * ```
     */
    substr(start?: ColumnValue<number>, length?: ColumnValue<number>): this

    /**
     * Replaces occurrences of text.
     *
     * @example
     * ```ts
     * // REPLACE(user.phone, '-', '')
     * user.phone.replace('-', '')
     * ```
     */
    replace(search: ColumnValue<number>, replacement: ColumnValue<number>): this

    /**
     * Finds the position of a substring.
     * Returns 0 if not found, or the index if found.
     *
     * @example
     * ```ts
     * // INSTR(user.email, '@')
     * user.email.instr('@')
     * ```
     */
    instr(substring: ColumnValue<string>): SqlNode
}

export interface IDateTimeColumn<TName extends string = string>
    extends IColumn<TName, Date | string> {
    /**
     * Greater than (>).
     * @example
     * ```ts
     * // user.createdAt > '2024-01-01'
     * user.createdAt.gt(new Date('2024-01-01'))
     */
    gt(value: ColumnValue<number>): SqlNode

    /**
     * Less than (>)..
     *
     * @example
     * ```ts
     * // user.expiresAt < NOW
     * user.expiresAt.lt(new Date())
     * ```
     */
    lt(value: ColumnValue<number>): SqlNode

    /**
     * Greater than or equal to (>=).
     *
     * @example
     * // user.lastLogin >= yesterday
     * user.lastLogin.ge(yesterday)
     */
    ge(value: ColumnValue<number>): SqlNode

    /**
     * Less than or equal to (<=).
     *
     * @example
     * // user.birthDate <= maxDate
     * user.birthDate.le(maxDate)
     */
    le(value: ColumnValue<number>): SqlNode

    /**
     * Within range (a – b).
     *
     * @example
     * ```ts
     * // user.createdAt BETWEEN startDate AND endDate
     * user.createdAt.between(startDate, endDate)
     */
    between(lower: ColumnValue<number>, upper: ColumnValue<number>): SqlNode

    /**
     * Extracts the date part.
     *
     * @example
     * ```ts
     * // DATE(user.createdAt)
     * user.createdAt.date()
     * ```
     */
    date(): this

    /**
     * Extracts the time part.
     *
     * @example
     * ```ts
     * // TIME(user.loginAt)
     * user.loginAt.time()
     * ```
     */
    time(): this

    /**
     * Converts to datetime format.
     *
     * @example
     * ```ts
     * // DATETIME(user.timestamp)
     * user.timestamp.dateTime()
     * ```
     */
    dateTime(): this

    /**
     * Converts to specified format string.
     *
     * @example
     * ```ts
     * // STRFTIME('%Y-%m-%d', user.createdAt)
     * user.createdAt.strftime('%Y-%m-%d')
     * ```
     */
    strftime(format: ColumnValue<string>): this

    /**
     * Converts to Julian day number.
     *
     * @example
     * ```ts
     * // JULIANDAY(user.birthDate)
     * user.birthDate.julianday()
     * ```
     */
    julianday(): this

    /**
     * Extracts the year.
     *
     * @example
     * ```ts
     * // STRFTIME('%Y', user.createdAt)
     * user.createdAt.year()
     * ```
     */
    year(): this

    /**
     * Extracts the month.
     *
     * @example
     * ```ts
     * // STRFTIME('%m', user.birthDate)
     * user.birthDate.month()
     * ```
     */
    month(): this

    /**
     * Extracts the day.
     *
     * @example
     * ```ts
     * // STRFTIME('%d', user.birthDate)
     * user.birthDate.day()
     * ```
     */
    day(): this
}

export interface IBooleanColumn<TName extends string = string>
    extends IColumn<TName, boolean> {
}

export interface IJsonColumn<TName extends string = string>
    extends IColumn<TName, Record<string, any>> {
}

/**
 * Base column class with common SQL operations.
 * Provides core functionality available to all column types including
 * comparisons, null checks, aliasing, and basic aggregates.
 */
export class Column<
    TName extends string = string,
    TType extends SqlParam = SqlParam,
> extends SqlNode implements IColumn<TName, TType> {
    protected _node?: SqlNode // Store expr/node for chaining

    constructor(
        protected readonly _name: TName,
        protected readonly _table?: string, // Opt. table ref.
        protected readonly _type?: TType,
    ) {
        super()
    }

    render(params: ParameterReg): string {
        if (this._node) {
            return this._node.render(params)
        }

        const identifier = this._table
            ? `${this._table}.${this._name}`
            : this._name

        return identifier.split('.')
            .map((p) => needsQuoting(p) ? `"${p}"` : p)
            .join('.')
    }

    /**
     * Creates a new column instance wrapping the given node.
     * Preserves the column's metadata for method chaining.
     */
    protected wrap<T extends Column<TName, TType>>(node: SqlNode): T {
        const Constructor = this.constructor as new (
            name: TName,
            table?: string,
            type?: TType,
        ) => T
        const wrapped = new Constructor(this._name, this._table, this._type)
        wrapped._node = node
        return wrapped
    }

    distinct(): this {
        return this.wrap(ex.distinct(this))
    }

    all(): this {
        return this.wrap(ex.all(this))
    }

    eq(value: ColumnValue<TType>): SqlNode {
        return ex.eq(this, expr(value))
    }

    ne(value: ColumnValue<TType>): SqlNode {
        return ex.ne(this, expr(value))
    }

    in(values: TType[]): SqlNode {
        return ex.in_(this, valueList(...values))
    }

    isNull(): SqlNode {
        return ex.isNull(this)
    }

    isNotNull(): SqlNode {
        return ex.isNotNull(this)
    }

    as(asName: ColumnValue<string>): SqlNode {
        return ex.alias(this, id(asName))
    }

    to(value: ColumnValue<TType>): SqlNode {
        return assign(this, expr(value))
    }

    asc(): SqlNode {
        return ex.asc(this)
    }

    desc(): SqlNode {
        return ex.desc(this)
    }

    count(): this {
        return this.wrap(fn.count(this))
    }

    max(): this {
        return this.wrap(fn.max(this))
    }

    min(): this {
        return this.wrap(fn.min(this))
    }
}

/**
 * Text column class with string manipulation and pattern matching operations.
 */
export class TextColumn<TName extends string = string>
    extends Column<TName, string>
    implements ITextColumn<TName> {
    like(pattern: ColumnValue<string>): SqlNode {
        return ex.like(this, expr(pattern))
    }

    glob(pattern: ColumnValue<string>): SqlNode {
        return ex.glob(this, expr(pattern))
    }

    startsWith(prefix: ColumnValue<string>): SqlNode {
        return ex.like(this, expr(prefix + '%'))
    }

    endsWith(suffix: ColumnValue<string>): SqlNode {
        return ex.like(this, expr('%' + suffix))
    }

    contains(substring: ColumnValue<string>): SqlNode {
        return ex.like(this, expr('%' + substring + '%'))
    }

    upper(): this {
        return this.wrap(fn.upper(this))
    }

    lower(): this {
        return this.wrap(fn.lower(this))
    }

    length(): this {
        return this.wrap(fn.length(this))
    }

    trim(): this {
        return this.wrap(fn.trim(this))
    }

    ltrim(): this {
        return this.wrap(fn.ltrim(this))
    }

    rtrim(): this {
        return this.wrap(fn.rtrim(this))
    }

    substr(
        start: ColumnValue<number> = 1,
        length?: ColumnValue<number>,
    ): this {
        const node: SqlNode = length !== undefined
            ? fn.substr(this, expr(start), expr(length))
            : fn.substr(this, expr(start))
        return this.wrap(node)
    }

    replace(
        search: ColumnValue<number>,
        replacement: ColumnValue<number>,
    ): this {
        return this.wrap(fn.replace(this, expr(search), expr(replacement)))
    }

    instr(substring: ColumnValue<string>): SqlNode {
        return fn.instr(this, expr(substring))
    }
}

/**
 * Numeric column class with mathematical operations and comparisons.
 */
export class NumberColumn<TName extends string = string>
    extends Column<TName, number>
    implements INumberColumn<TName> {
    gt(arg: ColumnValue<number>): SqlNode {
        return ex.gt(this, expr(arg))
    }
    lt(arg: ColumnValue<number>): SqlNode {
        return ex.lt(this, expr(arg))
    }
    ge(arg: ColumnValue<number>): SqlNode {
        return ex.ge(this, expr(arg))
    }
    le(arg: ColumnValue<number>): SqlNode {
        return ex.le(this, expr(arg))
    }
    between(
        lower: ColumnValue<number>,
        upper: ColumnValue<number>,
    ): SqlNode {
        return ex.between(this, lower, upper)
    }
    add(arg: ColumnValue<number>): this {
        return this.wrap(ex.add(this, expr(arg)))
    }
    sub(arg: ColumnValue<number>): this {
        return this.wrap(ex.sub(this, expr(arg)))
    }
    mul(arg: ColumnValue<number>): this {
        return this.wrap(ex.mul(this, expr(arg)))
    }
    div(arg: ColumnValue<number>): this {
        return this.wrap(ex.div(this, expr(arg)))
    }
    abs(): this {
        return this.wrap(fn.abs(this))
    }
    round(decimals?: ColumnValue<number>): this {
        const node: SqlNode = decimals !== undefined
            ? fn.round(this, expr(decimals))
            : fn.round(this)
        return this.wrap(node)
    }
    ceil(): this {
        return this.wrap(fn.ceil(this))
    }
    floor(): this {
        return this.wrap(fn.floor(this))
    }
    sqrt(): this {
        return this.wrap(fn.sqrt(this))
    }
    mod(divisor: ColumnValue<number>): this {
        return this.wrap(fn.mod(this, expr(divisor)))
    }
    pow(exponent: ColumnValue<number>): this {
        return this.wrap(fn.pow(this, expr(exponent)))
    }
    percent(total: ColumnValue<number>): this {
        return this.wrap(ex.mul(
            ex.div(this, expr(total)),
            expr(100),
        ))
    }
    avg(): this {
        return this.wrap(fn.avg(this))
    }
    sum(): this {
        return this.wrap(fn.sum(this))
    }
}

/**
 * DateTime column class with date/time manipulation and comparison operations.
 */
export class DateTimeColumn<TName extends string = string>
    extends Column<TName, Date | string>
    implements IDateTimeColumn<TName> {
    gt(arg: ColumnValue<Date>): SqlNode {
        return ex.gt(this, expr(arg))
    }

    lt(arg: ColumnValue<Date>): SqlNode {
        return ex.lt(this, expr(arg))
    }

    ge(arg: ColumnValue<Date>): SqlNode {
        return ex.ge(this, expr(arg))
    }

    le(arg: ColumnValue<Date>): SqlNode {
        return ex.le(this, expr(arg))
    }

    between(
        lower: ColumnValue<Date>,
        upper: ColumnValue<Date>,
    ): SqlNode {
        return ex.between(this, lower, upper)
    }

    date(): this {
        return this.wrap(fn.date(this))
    }

    time(): this {
        return this.wrap(fn.time(this))
    }

    dateTime(): this {
        return this.wrap(fn.dateTime(this))
    }

    strftime(format: ColumnValue<string>): this {
        return this.wrap(fn.strftime(expr(format), this))
    }

    julianday(): this {
        return this.wrap(fn.julianday(this))
    }

    year(): this {
        return this.wrap(fn.strftime(expr('%Y'), this))
    }

    month(): this {
        return this.wrap(fn.strftime(expr('%m'), this))
    }

    day(): this {
        return this.wrap(fn.strftime(expr('%d'), this))
    }
}

/**
 * Boolean column class for true/false values.
 */
export class BooleanColumn<TName extends string = string>
    extends Column<TName, boolean>
    implements IBooleanColumn<TName> {
}

/**
 * JSON column class for structured data storage.
 */
export class JsonColumn<TName extends string = string>
    extends Column<TName, Record<string, any>>
    implements IJsonColumn<TName> {
    // TODO(#sgtzym): Implement JSON handling - future feature!
}

/**
 * Factory functions for creating column type instances.
 * Use these to define your table schema.
 *
 * @example
 * ```ts
 * const users = sparq('users', {
 *   id: SqlType.number(),
 *   name: SqlType.text(),
 *   active: SqlType.boolean(),
 *   createdAt: SqlType.date()
 * })
 * ```
 */
export const SqlType = {
    number: (): number => 0,
    text: (): string => '',
    boolean: (): boolean => true,
    date: (): Date => new Date(),
    list: (): Uint8Array | null => null,
    json: (): Record<string, any> | undefined => undefined,
} as const
