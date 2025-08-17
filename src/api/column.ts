import {
    type Node,
    type NodeConvertible,
    type Param,
    toNode,
} from '~/core/node.ts'
import { id } from '~/nodes/primitives.ts'
import * as expr from '~/nodes/expressions.ts'
import * as fn from '~/nodes/functions.ts'
import { assign, valueList } from '~/nodes/values.ts'

type ColumnArg<TType extends Param = Param> =
    | TType
    | Column<string, TType>
    | Node
    | NodeConvertible

/**
 * Base column class with common SQL operations.
 *
 * Provides core functionality available to all column types including
 * comparisons, null checks, aliasing, and basic aggregates.
 *
 * @template TName - The column name type
 * @template TType - The column arg type
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
     * Returns distinct args only.
     */
    distinct(): Node {
        return expr.distinct(this.node)
    }

    /**
     * Returns all args.
     */
    all(): Node {
        return expr.all(this.node)
    }

    /**
     * Equals (=).
     * @param arg - The comparison arg
     */
    eq(arg: ColumnArg<TType>): Node {
        return expr.eq(this.node, toNode(arg))
    }

    /**
     * Not equal to (!=).
     * @param arg - The comparison arg
     */
    ne(arg: ColumnArg<TType>): Node {
        return expr.ne(this.node, toNode(arg))
    }

    /**
     * Membership in set.
     * @param args - The array of args to test against
     */
    in(args: TType[]): Node {
        return expr.in_(this.node, valueList(...args))
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
    as(asName: ColumnArg<string>): Node {
        return expr.alias(this.node, id(asName))
    }

    /**
     * Assigns a arg to the column.
     * @param arg - The arg or expression to assign
     */
    set(arg: ColumnArg<TType>): Node {
        return assign(this.node, toNode(arg))
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
     * Finds maximum arg (MAX).
     */
    max(): Node {
        return fn.max(this.node)
    }

    /**
     * Finds minimum arg (MIN).
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
    like(pattern: ColumnArg<string>): Node {
        return expr.like(this.node, toNode(pattern))
    }

    /**
     * Matches Unix file glob pattern.
     * Case-sensitive. Uses * (any characters), ? (single character), and [...] (character ranges).
     * @param pattern - The glob pattern to match
     */
    glob(pattern: ColumnArg<string>): Node {
        return expr.glob(this.node, toNode(pattern))
    }

    /**
     * Starts with the specified prefix.
     * Case-insensitive match using LIKE operator.
     * @param prefix - The prefix to match
     */
    startsWith(prefix: ColumnArg<string>): Node {
        return expr.like(this.node, toNode(prefix + '%'))
    }

    /**
     * Ends with the specified suffix.
     * Case-insensitive match using LIKE operator.
     * @param suffix - The suffix to match
     */
    endsWith(suffix: ColumnArg<string>): Node {
        return expr.like(this.node, toNode('%' + suffix))
    }

    /**
     * Contains the specified substring.
     * Case-insensitive match using LIKE operator.
     * @param substring - The substring to find
     */
    contains(substring: ColumnArg<string>): Node {
        return expr.like(this.node, toNode('%' + substring + '%'))
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
    substr(start: ColumnArg<number> = 1, length?: ColumnArg<number>): Node {
        return length !== undefined
            ? fn.substr(this.node, toNode(start), toNode(length))
            : fn.substr(this.node, toNode(start))
    }

    /**
     * Replaces occurrences of a substring.
     * @param search - The substring to find
     * @param replacement - The replacement string
     */
    replace(search: ColumnArg<number>, replacement: ColumnArg<number>): Node {
        return fn.replace(this.node, toNode(search), toNode(replacement))
    }

    /**
     * Finds the position of a substring.
     * Returns 0 if not found, or the index if found.
     * @param substring - The substring to find
     */
    instr(substring: ColumnArg<string>): Node {
        return fn.instr(this.node, toNode(substring))
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
    gt(arg: ColumnArg<number>): Node {
        return expr.gt(this.node, toNode(arg))
    }

    /**
     * Less than (<).
     * @param arg - The comparison arg
     */
    lt(arg: ColumnArg<number>): Node {
        return expr.lt(this.node, toNode(arg))
    }

    /**
     * Greater than or equal to (>=).
     * @param arg - The comparison arg
     */
    ge(arg: ColumnArg<number>): Node {
        return expr.ge(this.node, toNode(arg))
    }

    /**
     * Less than or equal to (<=).
     * @param arg - The comparison arg
     */
    le(arg: ColumnArg<number>): Node {
        return expr.le(this.node, toNode(arg))
    }

    /**
     * Within range (a to b).
     * @param lower - The lower bound (inclusive)
     * @param upper - The upper bound (inclusive)
     */
    between(
        lower: ColumnArg<number>,
        upper: ColumnArg<number>,
    ): Node {
        return expr.between(this.node, lower, upper)
    }

    /**
     * Adds arg (+).
     * @param arg - The arg to add
     */
    add(arg: ColumnArg<number>): Node {
        return expr.add(this.node, toNode(arg))
    }

    /**
     * Subtracts arg (-).
     * @param arg - The arg to subtract
     */
    sub(arg: ColumnArg<number>): Node {
        return expr.sub(this.node, toNode(arg))
    }

    /**
     * Multiplies by arg (*).
     * @param arg - The arg to multiply by
     */
    mul(arg: ColumnArg<number>): Node {
        return expr.mul(this.node, toNode(arg))
    }

    /**
     * Divides by arg (/).
     * @param arg - The arg to divide by
     */
    div(arg: ColumnArg<number>): Node {
        return expr.div(this.node, toNode(arg))
    }

    /**
     * Returns the absolute arg.
     */
    abs(): Node {
        return fn.abs(this.node)
    }

    /**
     * Rounds to the specified number of decimal places.
     * @param decimals - The number of decimal places (optional)
     */
    round(decimals?: ColumnArg<number>): Node {
        return decimals !== undefined
            ? fn.round(this.node, toNode(decimals))
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
     * @param divisor - The divisor arg
     */
    mod(divisor: ColumnArg<number>): Node {
        return fn.mod(this.node, toNode(divisor))
    }

    /**
     * Raises to the specified power.
     * @param exponent - The exponent arg
     */
    pow(exponent: ColumnArg<number>): Node {
        return fn.pow(this.node, toNode(exponent))
    }

    /**
     * Calculates percentage of a total.
     * @param total - The total arg
     */
    percent(total: ColumnArg<number>): Node {
        return expr.mul(
            expr.div(this.node, toNode(total)),
            toNode(100),
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
     * @param arg - The comparison arg
     */
    gt(arg: ColumnArg<Date>): Node {
        return expr.gt(this.node, toNode(arg))
    }

    /**
     * Less than (<).
     * @param arg - The comparison arg
     */
    lt(arg: ColumnArg<Date>): Node {
        return expr.lt(this.node, toNode(arg))
    }

    /**
     * Greater than or equal to (>=).
     * @param arg - The comparison arg
     */
    ge(arg: ColumnArg<Date>): Node {
        return expr.ge(this.node, toNode(arg))
    }

    /**
     * Less than or equal to (<=).
     * @param arg - The comparison arg
     */
    le(arg: ColumnArg<Date>): Node {
        return expr.le(this.node, toNode(arg))
    }

    /**
     * Within range (a to b).
     * @param lower - The lower bound (inclusive)
     * @param upper - The upper bound (inclusive)
     */
    between(
        lower: ColumnArg<Date>,
        upper: ColumnArg<Date>,
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
    strftime(format: ColumnArg<string>): Node {
        return fn.strftime(toNode(format), this.node)
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
        return fn.strftime(toNode('%Y'), this.node)
    }

    /**
     * Extracts the month portion (01-12).
     */
    month(): Node {
        return fn.strftime(toNode('%m'), this.node)
    }

    /**
     * Extracts the day portion (01-31).
     */
    day(): Node {
        return fn.strftime(toNode('%d'), this.node)
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
export const sqlTypes = {
    number: (): number => 0,
    text: (): string => '',
    boolean: (): boolean => true,
    date: (): Date => new Date(),
    list: (): Uint8Array | null => null,
    json: (): Record<string, any> | undefined => undefined,
}
