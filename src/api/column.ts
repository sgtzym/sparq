import { needsQuoting } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { SqlNode, type SqlParam } from '~/core/sql-node.ts'
import { expr, id } from '~/nodes/primitives.ts'
import * as ex from '~/nodes/expressions.ts'
import * as fn from '~/nodes/functions.ts'
import { assign, valueList } from '~/nodes/values.ts'

type ColumnValue<TType extends SqlParam = SqlParam> =
    | Column<string, TType>
    | SqlNode
    | TType

/**
 * Base column class with common SQL operations.
 *
 * Provides core functionality available to all column types including
 * comparisons, null checks, aliasing, and basic aggregates.
 *
 * @template TName - The column name type
 * @template TType - The column arg type
 */
export class Column<
    TName extends string = string,
    TType extends SqlParam = SqlParam,
> extends SqlNode {
    protected _node?: SqlNode // Store expr/node for chaining

    constructor(
        public _name: TName,
        public _table?: string, // Opt. table ref.
        public _type?: TType,
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
     * Preserves the column's metadata for chaining.
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

    /**
     * Returns distinct args only.
     */
    distinct(): this {
        return this.wrap(ex.distinct(this))
    }

    /**
     * Returns all args.
     */
    all(): this {
        return this.wrap(ex.all(this))
    }

    /**
     * Equals (=).
     * @param arg - The comparison arg
     */
    eq(arg: ColumnValue<TType>): SqlNode {
        return ex.eq(this, expr(arg))
    }

    /**
     * Not equal to (!=).
     * @param arg - The comparison arg
     */
    ne(arg: ColumnValue<TType>): SqlNode {
        return ex.ne(this, expr(arg))
    }

    /**
     * Membership in set.
     * @param args - The array of args to test against
     */
    in(args: TType[]): SqlNode {
        return ex.in_(this, valueList(...args))
    }

    /**
     * Is null.
     */
    isNull(): SqlNode {
        return ex.isNull(this)
    }

    /**
     * Is not null.
     */
    isNotNull(): SqlNode {
        return ex.isNotNull(this)
    }

    /**
     * Creates an alias (AS).
     * @param asName - The alias name
     */
    as(asName: ColumnValue<string>): SqlNode {
        return ex.alias(this, id(asName))
    }

    /**
     * Assigns a arg to the column.
     * @param arg - The arg or expression to assign
     */
    set(arg: ColumnValue<TType>): SqlNode {
        return assign(this, expr(arg))
    }

    /**
     * Sorts in ascending order (ASC).
     */
    asc(): SqlNode {
        return ex.asc(this)
    }

    /**
     * Sorts in descending order (DESC).
     */
    desc(): SqlNode {
        return ex.desc(this)
    }

    /**
     * Counts rows (COUNT).
     */
    count(): this {
        return this.wrap(fn.count(this))
    }

    /**
     * Finds maximum arg (MAX).
     */
    max(): this {
        return this.wrap(fn.max(this))
    }

    /**
     * Finds minimum arg (MIN).
     */
    min(): this {
        return this.wrap(fn.min(this))
    }
}

/**
 * Text column with string-specific operations.
 *
 * Extends the base column with string manipulation functions,
 * pattern matching, and text-specific transformations.
 *
 * @template TName - The column name type
 */
export class TextColumn<TName extends string = string>
    extends Column<TName, string> {
    /**
     * Matches pattern using wildcards.
     * Case-insensitive. Uses % (any characters) and _ (single character).
     * @param pattern - The pattern to match
     */
    like(pattern: ColumnValue<string>): SqlNode {
        return ex.like(this, expr(pattern))
    }

    /**
     * Matches Unix file glob pattern.
     * Case-sensitive. Uses * (any characters), ? (single character), and [...] (character ranges).
     * @param pattern - The glob pattern to match
     */
    glob(pattern: ColumnValue<string>): SqlNode {
        return ex.glob(this, expr(pattern))
    }

    /**
     * Starts with the specified prefix.
     * Case-insensitive match using LIKE operator.
     * @param prefix - The prefix to match
     */
    startsWith(prefix: ColumnValue<string>): SqlNode {
        return ex.like(this, expr(prefix + '%'))
    }

    /**
     * Ends with the specified suffix.
     * Case-insensitive match using LIKE operator.
     * @param suffix - The suffix to match
     */
    endsWith(suffix: ColumnValue<string>): SqlNode {
        return ex.like(this, expr('%' + suffix))
    }

    /**
     * Contains the specified substring.
     * Case-insensitive match using LIKE operator.
     * @param substring - The substring to find
     */
    contains(substring: ColumnValue<string>): SqlNode {
        return ex.like(this, expr('%' + substring + '%'))
    }

    /**
     * Converts to uppercase.
     */
    upper(): this {
        return this.wrap(fn.upper(this))
    }

    /**
     * Converts to lowercase.
     */
    lower(): this {
        return this.wrap(fn.lower(this))
    }

    /**
     * Returns the character count.
     */
    length(): this {
        return this.wrap(fn.length(this))
    }

    /**
     * Removes leading and trailing whitespace.
     */
    trim(): this {
        return this.wrap(fn.trim(this))
    }

    /**
     * Removes leading whitespace.
     */
    ltrim(): this {
        return this.wrap(fn.ltrim(this))
    }

    /**
     * Removes trailing whitespace.
     */
    rtrim(): this {
        return this.wrap(fn.rtrim(this))
    }

    /**
     * Extracts a substring from the string.
     * @param start - The starting position
     * @param length - The number of characters to extract (optional)
     */
    substr(
        start: ColumnValue<number> = 1,
        length?: ColumnValue<number>,
    ): this {
        const node: SqlNode = length !== undefined
            ? fn.substr(this, expr(start), expr(length))
            : fn.substr(this, expr(start))
        return this.wrap(node)
    }

    /**
     * Replaces occurrences of a substring.
     * @param search - The substring to find
     * @param replacement - The replacement string
     */
    replace(
        search: ColumnValue<number>,
        replacement: ColumnValue<number>,
    ): this {
        return this.wrap(fn.replace(this, expr(search), expr(replacement)))
    }

    /**
     * Finds the position of a substring.
     * Returns 0 if not found, or the index if found.
     * @param substring - The substring to find
     */
    instr(substring: ColumnValue<string>): SqlNode {
        return fn.instr(this, expr(substring))
    }
}

/**
 * Numeric column with mathematical operations.
 *
 * Extends the base column with arithmetic operations,
 * mathematical functions, and numeric aggregates.
 *
 * @template TName - The column name type
 */
export class NumberColumn<TName extends string = string>
    extends Column<TName, number> {
    /**
     * Greater than (>).
     * @param arg - The comparison arg
     */
    gt(arg: ColumnValue<number>): SqlNode {
        return ex.gt(this, expr(arg))
    }

    /**
     * Less than (<).
     * @param arg - The comparison arg
     */
    lt(arg: ColumnValue<number>): SqlNode {
        return ex.lt(this, expr(arg))
    }

    /**
     * Greater than or equal to (>=).
     * @param arg - The comparison arg
     */
    ge(arg: ColumnValue<number>): SqlNode {
        return ex.ge(this, expr(arg))
    }

    /**
     * Less than or equal to (<=).
     * @param arg - The comparison arg
     */
    le(arg: ColumnValue<number>): SqlNode {
        return ex.le(this, expr(arg))
    }

    /**
     * Within range (a to b).
     * @param lower - The lower bound (inclusive)
     * @param upper - The upper bound (inclusive)
     */
    between(
        lower: ColumnValue<number>,
        upper: ColumnValue<number>,
    ): SqlNode {
        return ex.between(this, lower, upper)
    }

    /**
     * Adds arg (+).
     * @param arg - The arg to add
     */
    add(arg: ColumnValue<number>): this {
        return this.wrap(ex.add(this, expr(arg)))
    }

    /**
     * Subtracts arg (-).
     * @param arg - The arg to subtract
     */
    sub(arg: ColumnValue<number>): this {
        return this.wrap(ex.sub(this, expr(arg)))
    }

    /**
     * Multiplies by arg (*).
     * @param arg - The arg to multiply by
     */
    mul(arg: ColumnValue<number>): this {
        return this.wrap(ex.mul(this, expr(arg)))
    }

    /**
     * Divides by arg (/).
     * @param arg - The arg to divide by
     */
    div(arg: ColumnValue<number>): this {
        return this.wrap(ex.div(this, expr(arg)))
    }

    /**
     * Returns the absolute arg.
     */
    abs(): this {
        return this.wrap(fn.abs(this))
    }

    /**
     * Rounds to the specified number of decimal places.
     * @param decimals - The number of decimal places (optional)
     */
    round(decimals?: ColumnValue<number>): this {
        const node: SqlNode = decimals !== undefined
            ? fn.round(this, expr(decimals))
            : fn.round(this)
        return this.wrap(node)
    }

    /**
     * Rounds up to the nearest integer.
     */
    ceil(): this {
        return this.wrap(fn.ceil(this))
    }

    /**
     * Rounds down to the nearest integer.
     */
    floor(): this {
        return this.wrap(fn.floor(this))
    }

    /**
     * Returns the square root.
     */
    sqrt(): this {
        return this.wrap(fn.sqrt(this))
    }

    /**
     * Returns the remainder after division.
     * @param divisor - The divisor arg
     */
    mod(divisor: ColumnValue<number>): this {
        return this.wrap(fn.mod(this, expr(divisor)))
    }

    /**
     * Raises to the specified power.
     * @param exponent - The exponent arg
     */
    pow(exponent: ColumnValue<number>): this {
        return this.wrap(fn.pow(this, expr(exponent)))
    }

    /**
     * Calculates percentage of a total.
     * @param total - The total arg
     */
    percent(total: ColumnValue<number>): this {
        return this.wrap(ex.mul(
            ex.div(this, expr(total)),
            expr(100),
        ))
    }

    /**
     * Calculates average (AVG).
     */
    avg(): this {
        return this.wrap(fn.avg(this))
    }

    /**
     * Calculates sum (SUM).
     */
    sum(): this {
        return this.wrap(fn.sum(this))
    }
}

/**
 * DateTime column with date/time operations.
 *
 * Extends the base column with date manipulation functions,
 * formatting options, and date-specific comparisons.
 *
 * @template TName - The column name type
 */
export class DateTimeColumn<TName extends string = string>
    extends Column<TName, Date | string> {
    /**
     * Greater than (>).
     * @param arg - The comparison arg
     */
    gt(arg: ColumnValue<Date>): SqlNode {
        return ex.gt(this, expr(arg))
    }

    /**
     * Less than (<).
     * @param arg - The comparison arg
     */
    lt(arg: ColumnValue<Date>): SqlNode {
        return ex.lt(this, expr(arg))
    }

    /**
     * Greater than or equal to (>=).
     * @param arg - The comparison arg
     */
    ge(arg: ColumnValue<Date>): SqlNode {
        return ex.ge(this, expr(arg))
    }

    /**
     * Less than or equal to (<=).
     * @param arg - The comparison arg
     */
    le(arg: ColumnValue<Date>): SqlNode {
        return ex.le(this, expr(arg))
    }

    /**
     * Within range (a to b).
     * @param lower - The lower bound (inclusive)
     * @param upper - The upper bound (inclusive)
     */
    between(
        lower: ColumnValue<Date>,
        upper: ColumnValue<Date>,
    ): SqlNode {
        return ex.between(this, lower, upper)
    }

    /**
     * Converts to date.
     */
    date(): this {
        return this.wrap(fn.date(this))
    }

    /**
     * Converts to time.
     */
    time(): this {
        return this.wrap(fn.time(this))
    }

    /**
     * Converts to datetime format.
     */
    dateTime(): this {
        return this.wrap(fn.dateTime(this))
    }

    /**
     * Formats date/time using the specified format string.
     * @param format - The strftime format string
     */
    strftime(format: ColumnValue<string>): this {
        return this.wrap(fn.strftime(expr(format), this))
    }

    /**
     * Converts to Julian day number.
     */
    julianday(): this {
        return this.wrap(fn.julianday(this))
    }

    /**
     * Extracts the year portion.
     */
    year(): this {
        return this.wrap(fn.strftime(expr('%Y'), this))
    }

    /**
     * Extracts the month portion (01-12).
     */
    month(): this {
        return this.wrap(fn.strftime(expr('%m'), this))
    }

    /**
     * Extracts the day portion (01-31).
     */
    day(): this {
        return this.wrap(fn.strftime(expr('%d'), this))
    }
}

export class BooleanColumn<TName extends string = string>
    extends Column<TName, boolean> {
}

export class JsonColumn<TName extends string = string>
    extends Column<TName, Record<string, any>> {
    // TODO(#sgtzym): Implement JSON handling - future feature!
}

/** SQL parameter data types */
export const SQL_DATA_TYPES = {
    number: (): number => 0,
    text: (): string => '',
    boolean: (): boolean => true,
    date: (): Date => new Date(),
    list: (): Uint8Array | null => null,
    json: (): Record<string, any> | undefined => undefined,
} as const
