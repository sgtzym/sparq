import type { SqlNode, SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id } from '~/nodes/primitives.ts'
import * as ex from '~/nodes/expressions.ts'
import * as fn from '~/nodes/functions.ts'
import { assign, valueList } from '~/nodes/values.ts'
import type { Column } from '~/api/column.ts'

// ---------------------------------------------
// Column mixins
// ---------------------------------------------

export class FilterByEquality<T extends Column = Column> {
    /** Filters by equality (=). */
    eq(this: T, value: SqlNodeValue): SqlNode {
        return ex.eq(this, expr(value))
    }
    /** Filters by inequality (!=).  */
    ne(this: T, value: SqlNodeValue): SqlNode {
        return ex.ne(this, expr(value))
    }
}

export class FilterByNull<T extends Column = Column> {
    /** Finds records with missing or empty values. */
    isNull(this: T): SqlNode {
        return ex.isNull(this)
    }
    /** Finds records with actual values. */
    isNotNull(this: T): SqlNode {
        return ex.isNotNull(this)
    }
}

export class FilterByInclusion<T extends Column = Column> {
    /** Filters by membership in set. */
    in(this: T, values: SqlNodeValue[]): SqlNode {
        return ex.in_(this, valueList(...values))
    }
}

export class FilterByComparison<T extends Column = Column> {
    /** Filters by greater than (>). */
    gt(this: T, value: SqlNodeValue): SqlNode {
        return ex.gt(this, expr(value))
    }

    /** Filters by less than (<). */
    lt(this: T, value: SqlNodeValue): SqlNode {
        return ex.lt(this, expr(value))
    }

    /** Filters by greater than or equal (>=). */
    ge(this: T, value: SqlNodeValue): SqlNode {
        return ex.ge(this, expr(value))
    }

    /** Filters by less than or equal (<=). */
    le(this: T, value: SqlNodeValue): SqlNode {
        return ex.le(this, expr(value))
    }

    /**
     * Filters by range.
     * Checks inclusively between lower and upper bounds.
     */
    between(this: T, lower: SqlNodeValue, upper: SqlNodeValue): SqlNode {
        return ex.between(this, lower, upper)
    }
}

export class ComputeByArithmetic<T extends Column = Column> {
    /** Adds value (+). */
    add(this: T, value: number): T {
        return this.wrap(ex.add(this, expr(value)))
    }

    /** Subtracts value (-). */
    sub(this: T, value: number): T {
        return this.wrap(ex.sub(this, expr(value)))
    }

    /** Multiplies value (*). */
    mul(this: T, value: number): T {
        return this.wrap(ex.mul(this, expr(value)))
    }

    /** Divides value (/). */
    div(this: T, value: number): T {
        return this.wrap(ex.div(this, expr(value)))
    }
}

export class ComputeByMath<T extends Column = Column> {
    /** Returns absolute value. */
    abs(this: T): T {
        return this.wrap(fn.abs(this))
    }

    /** Rounds to decimal places. */
    round(this: T, value?: number): T {
        return this.wrap(fn.round(this, value != null ? expr(value) : undefined))
    }

    /** Rounds up to integer. */
    ceil(this: T): T {
        return this.wrap(fn.ceil(this))
    }

    /** Rounds down to integer. */
    floor(this: T): T {
        return this.wrap(fn.floor(this))
    }

    /** Returns division remainder. */
    mod(this: T, value: number): T {
        return this.wrap(fn.mod(this, expr(value)))
    }

    /** Raises to power. */
    pow(this: T, value: number): T {
        return this.wrap(fn.pow(this, expr(value)))
    }

    /** Calculates square root. */
    sqrt(this: T): T {
        return this.wrap(fn.sqrt(this))
    }

    /** Generates random number. */
    random(this: T): T {
        return this.wrap(fn.random(this))
    }

    /** Calculates percentage of total. */
    percent(this: T, total: number): T {
        return this.wrap(ex.div(ex.mul(this, expr(100)), expr(total)))
    }
}

export class FilterByTextPattern<T extends Column = Column> {
    /** Filters by text pattern matches. */
    like(this: T, pattern: string): SqlNode {
        return ex.like(this, expr(pattern))
    }

    /** Filters by Unix glob pattern matches. */
    glob(this: T, pattern: string): SqlNode {
        return ex.glob(this, expr(pattern))
    }

    /** Filters by prefix. */
    startsWith(this: T, prefix: string): SqlNode {
        return ex.like(this, expr(prefix + '%'))
    }

    /** Filters by suffix. */
    endsWith(this: T, suffix: string): SqlNode {
        return ex.like(this, expr('%' + suffix))
    }

    /** Filters by substring. */
    contains(this: T, substring: string): SqlNode {
        return ex.like(this, expr('%' + substring + '%'))
    }
}

export class TransformText<T extends Column = Column> {
    /** Converts to uppercase. */
    upper(this: T): T {
        return this.wrap(fn.upper(this))
    }

    /** Converts to lowercase. */
    lower(this: T): T {
        return this.wrap(fn.lower(this))
    }

    /** Gets text length. */
    length(this: T): T {
        return this.wrap(fn.length(this))
    }

    /** Removes leading and trailing whitespace. */
    trim(this: T): T {
        return this.wrap(fn.trim(this))
    }

    /** Removes leading whitespace. */
    ltrim(this: T): T {
        return this.wrap(fn.ltrim(this))
    }

    /** Removes trailing whitespace. */
    rtrim(this: T): T {
        return this.wrap(fn.rtrim(this))
    }

    /**
     * Extracts substring.
     *
     * @example
     * ```ts
     * users.$.name.substr(1, 5) // First 5 characters
     * ```
     */
    substr(this: T, start: number = 1, length?: number): T {
        return this.wrap(
            length !== undefined
                ? fn.substr(this, expr(start), expr(length))
                : fn.substr(this, expr(start)),
        )
    }

    /** Replaces text occurrences. */
    replace(this: T, search: string, replacement: string): T {
        return this.wrap(fn.replace(this, expr(search), expr(replacement)))
    }

    /** Finds substring position. */
    instr(this: T, substring: string): SqlNode {
        return fn.instr(this, expr(substring))
    }
}

export class ExtractDate<T extends Column = Column> {
    year(this: T): T {
        return this.wrap(fn.strftime(expr('%Y'), this))
    }

    month(this: T): T {
        return this.wrap(fn.strftime(expr('%m'), this))
    }

    day(this: T): T {
        return this.wrap(fn.strftime(expr('%d'), this))
    }
}

export class FormatDate<T extends Column = Column> {
    /** Extracts date part. */
    date(this: T): T {
        return this.wrap(fn.date(this))
    }

    /** Extracts time part. */
    time(this: T): T {
        return this.wrap(fn.time(this))
    }

    /** Converts to datetime format. */
    dateTime(this: T): T {
        return this.wrap(fn.dateTime(this))
    }

    /** Formats datetime with custom pattern. */
    strftime(this: T, format: string): T {
        return this.wrap(fn.strftime(expr(format), this))
    }

    /** Converts to Julian day number. */
    julianday(this: T): T {
        return this.wrap(fn.julianday(this))
    }
}

export class Aggregate<T extends Column = Column> {
    /** Counts rows or non-null values. */
    count(this: T): T {
        return this.wrap(fn.count(this))
    }

    /** Finds the maximum value. */
    max(this: T): T {
        return this.wrap(fn.max(this))
    }

    /** Finds the minimum value. */
    min(this: T): T {
        return this.wrap(fn.min(this))
    }

    /**
     * Calculates the average value.
     * Finds the mean across all rows in a group.
     */
    avg(this: T): T {
        return this.wrap(fn.avg(this))
    }

    /** Calculates the sum of values. */
    sum(this: T): T {
        return this.wrap(fn.sum(this))
    }
}

export class Alias<T extends Column = Column> {
    /**
     * Creates an alias for columns or expressions.
     * Renames items in your result set.
     */
    as(this: T, alias: string): SqlNode {
        return ex.as_(this, id(alias))
    }
}

export class Assign<T extends Column = Column> {
    /** Assigns value. */
    to(this: T, value: SqlNodeValue): SqlNode {
        return assign(this, expr(value))
    }
}

export class Sort<T extends Column = Column> {
    /** Sorts ascending. */
    asc(this: T): SqlNode {
        return ex.asc(this)
    }

    /** Sorts descending. */
    desc(this: T): SqlNode {
        return ex.desc(this)
    }
}

export class Quantify<T extends Column = Column> {
    /** Removes duplicates. */
    distinct(this: T): T {
        return this.wrap(ex.distinct(this))
    }

    /** Includes all values. */
    all(this: T): T {
        return this.wrap(ex.all(this))
    }
}
