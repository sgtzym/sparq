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
    /** Removes duplicates. */
    distinct(): this

    /** Includes all values. */
    all(): this

    /** Tests equality (=). */
    eq(arg: ColumnValue<TType>): SqlNode

    /** Tests inequality (!=). */
    ne(arg: ColumnValue<TType>): SqlNode

    /** Tests membership in set. */
    in(args: TType[]): SqlNode

    /** Tests for null. */
    isNull(): SqlNode

    /** Tests for non-null. */
    isNotNull(): SqlNode

    /** Creates an alias. */
    as(asName: ColumnValue<string>): SqlNode

    /** Assigns a value (for updates). */
    to(value: ColumnValue<TType>): SqlNode

    /** Sorts ascending. */
    asc(): SqlNode

    /** Sorts descending. */
    desc(): SqlNode

    /** Counts non-null values. */
    count(): this

    /** Finds maximum value. */
    max(): this

    /** Finds minimum value. */
    min(): this
}

export interface INumberColumn<TName extends string = string>
    extends IColumn<TName, number> {
    /** Tests if greater than (>). */
    gt(value: ColumnValue<number>): SqlNode

    /** Tests if less than (<). */
    lt(value: ColumnValue<number>): SqlNode

    /** Tests if greater than or equal (>=). */
    ge(value: ColumnValue<number>): SqlNode

    /** Tests if less than or equal (<=). */
    le(value: ColumnValue<number>): SqlNode

    /** Tests if within range. */
    between(lower: ColumnValue<number>, upper: ColumnValue<number>): SqlNode

    /** Adds value (+). */
    add(value: ColumnValue<number>): this

    /** Subtracts value (-). */
    sub(value: ColumnValue<number>): this

    /** Multiplies value (*). */
    mul(value: ColumnValue<number>): this

    /** Divides value (/). */
    div(value: ColumnValue<number>): this

    /** Returns absolute value. */
    abs(): this

    /** Rounds to decimal places. */
    round(decimals?: ColumnValue<number>): this

    /** Rounds up to integer. */
    ceil(): this

    /** Rounds down to integer. */
    floor(): this

    /** Returns division remainder. */
    mod(divisor: ColumnValue<number>): this

    /** Raises to power. */
    pow(exponent: ColumnValue<number>): this

    /** Calculates square root. */
    sqrt(): this

    /** Calculates percentage of a total. */
    percent(total: ColumnValue<number>): this

    /** Calculates the average value. */
    avg(): this

    /** Calculates the sum of values. */
    sum(): this
}

export interface ITextColumn<TName extends string = string>
    extends IColumn<TName, string> {
    /**
     * Matches text pattern.
     * Use "%" as wildcard.
     *
     * @example
     * ```ts
     * //users.name LIKE "%DOE"
     * users.$.name.like('%Doe')
     * ```
     */
    like(pattern: ColumnValue<string>): SqlNode

    /** Matches Unix glob pattern. */
    glob(pattern: ColumnValue<string>): SqlNode

    /** Tests if text starts with prefix. */
    startsWith(prefix: ColumnValue<string>): SqlNode

    /** Tests if text ends with suffix. */
    endsWith(suffix: ColumnValue<string>): SqlNode

    /** Matches text containing substring. */
    contains(substring: ColumnValue<string>): SqlNode

    /** Converts to uppercase. */
    upper(): this

    /** Converts to lowercase. */
    lower(): this

    /** Gets text length. */
    length(): this

    /** Removes leading and trailing whitespace. */
    trim(): this

    /** Removes leading whitespace. */
    ltrim(): this

    /** Removes trailing whitespace. */
    rtrim(): this

    /**
     * Extracts a substring.
     *
     * @example
     * ```ts
     * users.$.name.substr(1, 5) // First 5 characters
     * ```
     */
    substr(start?: ColumnValue<number>, length?: ColumnValue<number>): this

    /** Replaces text occurrences. */
    replace(search: ColumnValue<number>, replacement: ColumnValue<number>): this

    /** Finds substring position. */
    instr(substring: ColumnValue<string>): SqlNode
}

export interface IDateTimeColumn<TName extends string = string>
    extends IColumn<TName, Date | string> {
    /** Tests if greater than (>). */
    gt(value: ColumnValue<number>): SqlNode

    /** Tests if less than (<). */
    lt(value: ColumnValue<number>): SqlNode

    /** Tests if greater than or equal (>=). */
    ge(value: ColumnValue<number>): SqlNode

    /** Tests if less than or equal (<=). */
    le(value: ColumnValue<number>): SqlNode

    /** Tests if within range. */
    between(lower: ColumnValue<number>, upper: ColumnValue<number>): SqlNode

    /** Extracts date part. */
    date(): this

    /** Extracts time part. */
    time(): this

    /** Converts to datetime format. */
    dateTime(): this

    /** Formats datetime with custom pattern. */
    strftime(format: ColumnValue<string>): this

    /** Converts to Julian day number. */
    julianday(): this

    /** Extracts the year. */
    year(): this

    /** Extracts the month. */
    month(): this

    /** Extracts the day. */
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
        return ex.as_(this, id(asName))
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
 * Column type factories for schema definition.
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
