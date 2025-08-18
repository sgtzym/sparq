import {
    type ParameterReg,
    SqlNode,
    type SqlParam,
    toSqlNode,
} from '~/core/node.ts'
import { id } from '~/nodes/primitives.ts'
import * as expr from '~/nodes/expressions.ts'
import * as fn from '~/nodes/functions.ts'
import { assign, valueList } from '~/nodes/values.ts'
import { needsQuoting } from '../core/sql.ts'

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
    protected _node?: SqlNode // Store node for chaining

    constructor(
        public _name: TName,
        public _table?: string, // Opt. table ref.
        public _type?: TType,
    ) {
        super()
    }

    render(_params: ParameterReg): string {
        const identifier = this._table
            ? `${this._table}.${this._name}`
            : this._name

        return identifier.split('.')
            .map((p) => needsQuoting(p) ? `"${p}"` : p)
            .join('.')
    }

    /**
     * Returns distinct args only.
     */
    distinct(): SqlNode {
        return expr.distinct(this)
    }

    /**
     * Returns all args.
     */
    all(): SqlNode {
        return expr.all(this)
    }

    /**
     * Equals (=).
     * @param arg - The comparison arg
     */
    eq(arg: ColumnValue<TType>): SqlNode {
        return expr.eq(this, toSqlNode(arg))
    }

    /**
     * Not equal to (!=).
     * @param arg - The comparison arg
     */
    ne(arg: ColumnValue<TType>): SqlNode {
        return expr.ne(this, toSqlNode(arg))
    }

    /**
     * Membership in set.
     * @param args - The array of args to test against
     */
    in(args: TType[]): SqlNode {
        return expr.in_(this, valueList(...args))
    }

    /**
     * Is null.
     */
    isNull(): SqlNode {
        return expr.isNull(this)
    }

    /**
     * Is not null.
     */
    isNotNull(): SqlNode {
        return expr.isNotNull(this)
    }

    /**
     * Creates an alias (AS).
     * @param asName - The alias name
     */
    as(asName: ColumnValue<string>): SqlNode {
        return expr.alias(this, id(asName))
    }

    /**
     * Assigns a arg to the column.
     * @param arg - The arg or expression to assign
     */
    set(arg: ColumnValue<TType>): SqlNode {
        return assign(this, toSqlNode(arg))
    }

    /**
     * Sorts in ascending order (ASC).
     */
    asc(): SqlNode {
        return expr.asc(this)
    }

    /**
     * Sorts in descending order (DESC).
     */
    desc(): SqlNode {
        return expr.desc(this)
    }

    /**
     * Counts rows (COUNT).
     */
    count(): SqlNode {
        return fn.count(this)
    }

    /**
     * Finds maximum arg (MAX).
     */
    max(): SqlNode {
        return fn.max(this)
    }

    /**
     * Finds minimum arg (MIN).
     */
    min(): SqlNode {
        return fn.min(this)
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
        return expr.like(this, toSqlNode(pattern))
    }

    /**
     * Matches Unix file glob pattern.
     * Case-sensitive. Uses * (any characters), ? (single character), and [...] (character ranges).
     * @param pattern - The glob pattern to match
     */
    glob(pattern: ColumnValue<string>): SqlNode {
        return expr.glob(this, toSqlNode(pattern))
    }

    /**
     * Starts with the specified prefix.
     * Case-insensitive match using LIKE operator.
     * @param prefix - The prefix to match
     */
    startsWith(prefix: ColumnValue<string>): SqlNode {
        return expr.like(this, toSqlNode(prefix + '%'))
    }

    /**
     * Ends with the specified suffix.
     * Case-insensitive match using LIKE operator.
     * @param suffix - The suffix to match
     */
    endsWith(suffix: ColumnValue<string>): SqlNode {
        return expr.like(this, toSqlNode('%' + suffix))
    }

    /**
     * Contains the specified substring.
     * Case-insensitive match using LIKE operator.
     * @param substring - The substring to find
     */
    contains(substring: ColumnValue<string>): SqlNode {
        return expr.like(this, toSqlNode('%' + substring + '%'))
    }

    /**
     * Converts to uppercase.
     */
    upper(): SqlNode {
        return fn.upper(this)
    }

    /**
     * Converts to lowercase.
     */
    lower(): SqlNode {
        return fn.lower(this)
    }

    /**
     * Returns the character count.
     */
    length(): SqlNode {
        return fn.length(this)
    }

    /**
     * Removes leading and trailing whitespace.
     */
    trim(): SqlNode {
        return fn.trim(this)
    }

    /**
     * Removes leading whitespace.
     */
    ltrim(): SqlNode {
        return fn.ltrim(this)
    }

    /**
     * Removes trailing whitespace.
     */
    rtrim(): SqlNode {
        return fn.rtrim(this)
    }

    /**
     * Extracts a substring from the string.
     * @param start - The starting position
     * @param length - The number of characters to extract (optional)
     */
    substr(
        start: ColumnValue<number> = 1,
        length?: ColumnValue<number>,
    ): SqlNode {
        const node: SqlNode = length !== undefined
            ? fn.substr(this, toSqlNode(start), toSqlNode(length))
            : fn.substr(this, toSqlNode(start))
        return node
    }

    /**
     * Replaces occurrences of a substring.
     * @param search - The substring to find
     * @param replacement - The replacement string
     */
    replace(
        search: ColumnValue<number>,
        replacement: ColumnValue<number>,
    ): SqlNode {
        return fn.replace(this, toSqlNode(search), toSqlNode(replacement))
    }

    /**
     * Finds the position of a substring.
     * Returns 0 if not found, or the index if found.
     * @param substring - The substring to find
     */
    instr(substring: ColumnValue<string>): SqlNode {
        return fn.instr(this, toSqlNode(substring))
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
        return expr.gt(this, toSqlNode(arg))
    }

    /**
     * Less than (<).
     * @param arg - The comparison arg
     */
    lt(arg: ColumnValue<number>): SqlNode {
        return expr.lt(this, toSqlNode(arg))
    }

    /**
     * Greater than or equal to (>=).
     * @param arg - The comparison arg
     */
    ge(arg: ColumnValue<number>): SqlNode {
        return expr.ge(this, toSqlNode(arg))
    }

    /**
     * Less than or equal to (<=).
     * @param arg - The comparison arg
     */
    le(arg: ColumnValue<number>): SqlNode {
        return expr.le(this, toSqlNode(arg))
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
        return expr.between(this, lower, upper)
    }

    /**
     * Adds arg (+).
     * @param arg - The arg to add
     */
    add(arg: ColumnValue<number>): SqlNode {
        return expr.add(this, toSqlNode(arg))
    }

    /**
     * Subtracts arg (-).
     * @param arg - The arg to subtract
     */
    sub(arg: ColumnValue<number>): SqlNode {
        return expr.sub(this, toSqlNode(arg))
    }

    /**
     * Multiplies by arg (*).
     * @param arg - The arg to multiply by
     */
    mul(arg: ColumnValue<number>): SqlNode {
        return expr.mul(this, toSqlNode(arg))
    }

    /**
     * Divides by arg (/).
     * @param arg - The arg to divide by
     */
    div(arg: ColumnValue<number>): SqlNode {
        return expr.div(this, toSqlNode(arg))
    }

    /**
     * Returns the absolute arg.
     */
    abs(): SqlNode {
        return fn.abs(this)
    }

    /**
     * Rounds to the specified number of decimal places.
     * @param decimals - The number of decimal places (optional)
     */
    round(decimals?: ColumnValue<number>): SqlNode {
        const node: SqlNode = decimals !== undefined
            ? fn.round(this, toSqlNode(decimals))
            : fn.round(this)
        return node
    }

    /**
     * Rounds up to the nearest integer.
     */
    ceil(): SqlNode {
        return fn.ceil(this)
    }

    /**
     * Rounds down to the nearest integer.
     */
    floor(): SqlNode {
        return fn.floor(this)
    }

    /**
     * Returns the square root.
     */
    sqrt(): SqlNode {
        return fn.sqrt(this)
    }

    /**
     * Returns the remainder after division.
     * @param divisor - The divisor arg
     */
    mod(divisor: ColumnValue<number>): SqlNode {
        return fn.mod(this, toSqlNode(divisor))
    }

    /**
     * Raises to the specified power.
     * @param exponent - The exponent arg
     */
    pow(exponent: ColumnValue<number>): SqlNode {
        return fn.pow(this, toSqlNode(exponent))
    }

    /**
     * Calculates percentage of a total.
     * @param total - The total arg
     */
    percent(total: ColumnValue<number>): SqlNode {
        return expr.mul(
            expr.div(this, toSqlNode(total)),
            toSqlNode(100),
        )
    }

    /**
     * Calculates average (AVG).
     */
    avg(): SqlNode {
        return fn.avg(this)
    }

    /**
     * Calculates sum (SUM).
     */
    sum(): SqlNode {
        return fn.sum(this)
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
        return expr.gt(this, toSqlNode(arg))
    }

    /**
     * Less than (<).
     * @param arg - The comparison arg
     */
    lt(arg: ColumnValue<Date>): SqlNode {
        return expr.lt(this, toSqlNode(arg))
    }

    /**
     * Greater than or equal to (>=).
     * @param arg - The comparison arg
     */
    ge(arg: ColumnValue<Date>): SqlNode {
        return expr.ge(this, toSqlNode(arg))
    }

    /**
     * Less than or equal to (<=).
     * @param arg - The comparison arg
     */
    le(arg: ColumnValue<Date>): SqlNode {
        return expr.le(this, toSqlNode(arg))
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
        return expr.between(this, lower, upper)
    }

    /**
     * Converts to date.
     */
    date(): SqlNode {
        return fn.date(this)
    }

    /**
     * Converts to time.
     */
    time(): SqlNode {
        return fn.time(this)
    }

    /**
     * Converts to datetime format.
     */
    dateTime(): SqlNode {
        return fn.dateTime(this)
    }

    /**
     * Formats date/time using the specified format string.
     * @param format - The strftime format string
     */
    strftime(format: ColumnValue<string>): SqlNode {
        return fn.strftime(toSqlNode(format), this)
    }

    /**
     * Converts to Julian day number.
     */
    julianday(): SqlNode {
        return fn.julianday(this)
    }

    /**
     * Extracts the year portion.
     */
    year(): SqlNode {
        return fn.strftime(toSqlNode('%Y'), this)
    }

    /**
     * Extracts the month portion (01-12).
     */
    month(): SqlNode {
        return fn.strftime(toSqlNode('%m'), this)
    }

    /**
     * Extracts the day portion (01-31).
     */
    day(): SqlNode {
        return fn.strftime(toSqlNode('%d'), this)
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
