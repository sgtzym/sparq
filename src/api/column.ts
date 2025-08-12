import {
    type Node,
    type NodeConvertible,
    type Param,
    toNode,
} from '~/core/node.ts'
import { id, val } from '~/nodes/primitives.ts'
import * as expr from '~/nodes/expressions.ts'
import * as fn from '~/nodes/functions.ts'
import { assign, valueList } from '~/nodes/values.ts'

/**
 * Base column class with common SQL operations.
 *
 * Provides core functionality available to all column types including
 * comparisons, null checks, aliasing, and basic aggregates.
 *
 * @template TName - The column name type
 * @template TType - The column value type
 */
export class Column<TName extends string = string, TType extends Param = Param>
    implements NodeConvertible {
    constructor(
        private readonly _name: TName,
        private readonly _table?: string, // Opt. table ref.
        private readonly _type?: TType,
    ) {}

    // Returns the qualified name if table is present, lazy init
    get node(): Node {
        return id(this._table ? `${this._table}.${this._name}` : this._name)
    }

    /**
     * Returns distinct values only.
     */
    distinct(): Node {
        return expr.distinct(this.node)
    }

    /**
     * Returns all values.
     */
    all(): Node {
        return expr.all(this.node)
    }

    /**
     * Equals (=).
     * @param value - The comparison value
     */
    eq(value: TType | Column<string, TType> | Node): Node {
        return expr.eq(this.node, toNode(value))
    }

    /**
     * Not equal to (!=).
     * @param value - The comparison value
     */
    ne(value: TType | Column<string, TType> | Node): Node {
        return expr.ne(this.node, toNode(value))
    }

    /**
     * Membership in set.
     * @param values - The array of values to test against
     */
    in(values: TType[]): Node {
        return expr.in_(this.node, valueList(...values))
    }

    /**
     * Is null.
     */
    isNull(): Node {
        return expr.isNull(this.node)
    }

    /**
     * Is not null.
     */
    isNotNull(): Node {
        return expr.isNotNull(this.node)
    }

    /**
     * Creates an alias (AS).
     * @param asName - The alias name
     */
    as(asName: string): Node {
        return expr.alias(this.node, id(asName))
    }

    /**
     * Assigns a value to the column.
     * @param value - The value or expression to assign
     */
    set(value: TType | Node): Node {
        return assign(this.node, toNode(value))
    }

    /**
     * Sorts in ascending order (ASC).
     */
    asc(): Node {
        return expr.asc(this.node)
    }

    /**
     * Sorts in descending order (DESC).
     */
    desc(): Node {
        return expr.desc(this.node)
    }

    /**
     * Counts rows (COUNT).
     */
    count(): Node {
        return fn.count(this.node)
    }

    /**
     * Finds maximum value (MAX).
     */
    max(): Node {
        return fn.max(this.node)
    }

    /**
     * Finds minimum value (MIN).
     */
    min(): Node {
        return fn.min(this.node)
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
    like(pattern: string): Node {
        return expr.like(this.node, val(pattern))
    }

    /**
     * Matches Unix file glob pattern.
     * Case-sensitive. Uses * (any characters), ? (single character), and [...] (character ranges).
     * @param pattern - The glob pattern to match
     */
    glob(pattern: string): Node {
        return expr.glob(this.node, val(pattern))
    }

    /**
     * Starts with the specified prefix.
     * Case-insensitive match using LIKE operator.
     * @param prefix - The prefix to match
     */
    startsWith(prefix: string): Node {
        return expr.like(this.node, val(prefix + '%'))
    }

    /**
     * Ends with the specified suffix.
     * Case-insensitive match using LIKE operator.
     * @param suffix - The suffix to match
     */
    endsWith(suffix: string): Node {
        return expr.like(this.node, val('%' + suffix))
    }

    /**
     * Contains the specified substring.
     * Case-insensitive match using LIKE operator.
     * @param substring - The substring to find
     */
    contains(substring: string): Node {
        return expr.like(this.node, val('%' + substring + '%'))
    }

    /**
     * Converts to uppercase.
     */
    upper(): Node {
        return fn.upper(this.node)
    }

    /**
     * Converts to lowercase.
     */
    lower(): Node {
        return fn.lower(this.node)
    }

    /**
     * Returns the character count.
     */
    length(): Node {
        return fn.length(this.node)
    }

    /**
     * Removes leading and trailing whitespace.
     */
    trim(): Node {
        return fn.trim(this.node)
    }

    /**
     * Removes leading whitespace.
     */
    ltrim(): Node {
        return fn.ltrim(this.node)
    }

    /**
     * Removes trailing whitespace.
     */
    rtrim(): Node {
        return fn.rtrim(this.node)
    }

    /**
     * Extracts a substring from the string.
     * @param start - The starting position
     * @param length - The number of characters to extract (optional)
     */
    substr(start: number = 1, length?: number): Node {
        return length !== undefined
            ? fn.substr(this.node, val(start), val(length))
            : fn.substr(this.node, val(start))
    }

    /**
     * Replaces occurrences of a substring.
     * @param search - The substring to find
     * @param replacement - The replacement string
     */
    replace(search: string, replacement: string): Node {
        return fn.replace(this.node, val(search), val(replacement))
    }

    /**
     * Finds the position of a substring.
     * Returns 0 if not found, or the index if found.
     * @param substring - The substring to find
     */
    instr(substring: string): Node {
        return fn.instr(this.node, val(substring))
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
     * @param value - The comparison value
     */
    gt(value: number | Column<string, number> | Node): Node {
        return expr.gt(this.node, toNode(value))
    }

    /**
     * Less than (<).
     * @param value - The comparison value
     */
    lt(value: number | Column<string, number> | Node): Node {
        return expr.lt(this.node, toNode(value))
    }

    /**
     * Greater than or equal to (>=).
     * @param value - The comparison value
     */
    ge(value: number | Column<string, number> | Node): Node {
        return expr.ge(this.node, toNode(value))
    }

    /**
     * Less than or equal to (<=).
     * @param value - The comparison value
     */
    le(value: number | Column<string, number> | Node): Node {
        return expr.le(this.node, toNode(value))
    }

    /**
     * Within range (a to b).
     * @param lower - The lower bound (inclusive)
     * @param upper - The upper bound (inclusive)
     */
    between(
        lower: number,
        upper: number,
    ): Node {
        return expr.between(this.node, lower, upper)
    }

    /**
     * Adds value (+).
     * @param value - The value to add
     */
    add(value: number): Node {
        return expr.add(this.node, val(value))
    }

    /**
     * Subtracts value (-).
     * @param value - The value to subtract
     */
    sub(value: number): Node {
        return expr.sub(this.node, val(value))
    }

    /**
     * Multiplies by value (*).
     * @param value - The value to multiply by
     */
    mul(value: number): Node {
        return expr.mul(this.node, val(value))
    }

    /**
     * Divides by value (/).
     * @param value - The value to divide by
     */
    div(value: number): Node {
        return expr.div(this.node, val(value))
    }

    /**
     * Returns the absolute value.
     */
    abs(): Node {
        return fn.abs(this.node)
    }

    /**
     * Rounds to the specified number of decimal places.
     * @param decimals - The number of decimal places (optional)
     */
    round(decimals?: number): Node {
        return decimals !== undefined
            ? fn.round(this.node, val(decimals))
            : fn.round(this.node)
    }

    /**
     * Rounds up to the nearest integer.
     */
    ceil(): Node {
        return fn.ceil(this.node)
    }

    /**
     * Rounds down to the nearest integer.
     */
    floor(): Node {
        return fn.floor(this.node)
    }

    /**
     * Returns the square root.
     */
    sqrt(): Node {
        return fn.sqrt(this.node)
    }

    /**
     * Returns the remainder after division.
     * @param divisor - The divisor value
     */
    mod(divisor: number): Node {
        return fn.mod(this.node, val(divisor))
    }

    /**
     * Raises to the specified power.
     * @param exponent - The exponent value
     */
    pow(exponent: number): Node {
        return fn.pow(this.node, val(exponent))
    }

    /**
     * Calculates percentage of a total.
     * @param total - The total value
     */
    percent(total: number): Node {
        return expr.mul(
            expr.div(this.node, val(total)),
            val(100),
        )
    }

    /**
     * Calculates average (AVG).
     */
    avg(): Node {
        return fn.avg(this.node)
    }

    /**
     * Calculates sum (SUM).
     */
    sum(): Node {
        return fn.sum(this.node)
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
     * @param value - The comparison value
     */
    gt(value: Date | string | Column<string, Date | string> | Node): Node {
        return expr.gt(this.node, toNode(value))
    }

    /**
     * Less than (<).
     * @param value - The comparison value
     */
    lt(value: Date | string | Column<string, Date | string> | Node): Node {
        return expr.lt(this.node, toNode(value))
    }

    /**
     * Greater than or equal to (>=).
     * @param value - The comparison value
     */
    ge(value: Date | string | Column<string, Date | string> | Node): Node {
        return expr.ge(this.node, toNode(value))
    }

    /**
     * Less than or equal to (<=).
     * @param value - The comparison value
     */
    le(value: Date | string | Column<string, Date | string> | Node): Node {
        return expr.le(this.node, toNode(value))
    }

    /**
     * Within range (a to b).
     * @param lower - The lower bound (inclusive)
     * @param upper - The upper bound (inclusive)
     */
    between(
        lower: Date | string,
        upper: Date | string,
    ): Node {
        return expr.between(this.node, lower, upper)
    }

    /**
     * Converts to date.
     */
    date(): Node {
        return fn.date(this.node)
    }

    /**
     * Converts to time.
     */
    time(): Node {
        return fn.time(this.node)
    }

    /**
     * Converts to datetime format.
     */
    dateTime(): Node {
        return fn.dateTime(this.node)
    }

    /**
     * Formats date/time using the specified format string.
     * @param format - The strftime format string
     */
    strftime(format: string): Node {
        return fn.strftime(val(format), this.node)
    }

    /**
     * Converts to Julian day number.
     */
    julianday(): Node {
        return fn.julianday(this.node)
    }

    /**
     * Extracts the year portion.
     */
    year(): Node {
        return fn.strftime(val('%Y'), this.node)
    }

    /**
     * Extracts the month portion (01-12).
     */
    month(): Node {
        return fn.strftime(val('%m'), this.node)
    }

    /**
     * Extracts the day portion (01-31).
     */
    day(): Node {
        return fn.strftime(val('%d'), this.node)
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
export const col = {
    number: (): number => 0,
    text: (): string => '',
    boolean: (): boolean => true,
    date: (): Date => new Date(),
    list: (): Uint8Array | null => null,
    json: (): Record<string, any> | undefined => undefined,
}
