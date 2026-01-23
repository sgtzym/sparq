import type { SqlNode, SqlNodeValue } from '~core'
import {
	abs,
	add,
	all,
	as_,
	asc,
	assign,
	avg,
	between,
	ceil,
	count,
	date,
	dateTime,
	desc,
	distinct,
	div,
	eq,
	expr,
	floor,
	ge,
	glob,
	gt,
	id,
	in_,
	instr,
	isNotNull,
	isNull,
	julianday,
	le,
	length,
	like,
	lower,
	lt,
	ltrim,
	max,
	min,
	mod,
	mul,
	ne,
	pow,
	random,
	replace,
	round,
	rtrim,
	sqrt,
	strftime,
	sub,
	substr,
	sum,
	time,
	trim,
	upper,
	valueList,
} from '~node'
import type { Column } from '~api'

// ---------------------------------------------
// Column mixins
// ---------------------------------------------

export class FilterByEquality<T extends Column = Column> {
	/** Filters by equality (=). */
	eq(this: T, value: SqlNodeValue): SqlNode {
		return eq(this, expr(value))
	}
	/** Filters by inequality (!=).  */
	ne(this: T, value: SqlNodeValue): SqlNode {
		return ne(this, expr(value))
	}
}

export class FilterByNull<T extends Column = Column> {
	/** Finds records with missing or empty values. */
	isNull(this: T): SqlNode {
		return isNull(this)
	}
	/** Finds records with actual values. */
	isNotNull(this: T): SqlNode {
		return isNotNull(this)
	}
}

export class FilterByInclusion<T extends Column = Column> {
	/** Filters by membership in set. */
	in(this: T, values: SqlNodeValue[]): SqlNode {
		return in_(this, valueList(...values))
	}
}

export class FilterByComparison<T extends Column = Column> {
	/** Filters by greater than (>). */
	gt(this: T, value: SqlNodeValue): SqlNode {
		return gt(this, expr(value))
	}

	/** Filters by less than (<). */
	lt(this: T, value: SqlNodeValue): SqlNode {
		return lt(this, expr(value))
	}

	/** Filters by greater than or equal (>=). */
	ge(this: T, value: SqlNodeValue): SqlNode {
		return ge(this, expr(value))
	}

	/** Filters by less than or equal (<=). */
	le(this: T, value: SqlNodeValue): SqlNode {
		return le(this, expr(value))
	}

	/**
	 * Filters by range.
	 * Checks inclusively between lower and upper bounds.
	 */
	between(this: T, lower: SqlNodeValue, upper: SqlNodeValue): SqlNode {
		return between(this, lower, upper)
	}
}

export class ComputeByArithmetic<T extends Column = Column> {
	/** Adds value (+). */
	add(this: T, value: number): T {
		return this.wrap(add(this, expr(value)))
	}

	/** Subtracts value (-). */
	sub(this: T, value: number): T {
		return this.wrap(sub(this, expr(value)))
	}

	/** Multiplies value (*). */
	mul(this: T, value: number): T {
		return this.wrap(mul(this, expr(value)))
	}

	/** Divides value (/). */
	div(this: T, value: number): T {
		return this.wrap(div(this, expr(value)))
	}
}

export class ComputeByMath<T extends Column = Column> {
	/** Returns absolute value. */
	abs(this: T): T {
		return this.wrap(abs(this))
	}

	/** Rounds to decimal places. */
	round(this: T, value?: number): T {
		return this.wrap(round(this, value != null ? expr(value) : undefined))
	}

	/** Rounds up to integer. */
	ceil(this: T): T {
		return this.wrap(ceil(this))
	}

	/** Rounds down to integer. */
	floor(this: T): T {
		return this.wrap(floor(this))
	}

	/** Returns division remainder. */
	mod(this: T, value: number): T {
		return this.wrap(mod(this, expr(value)))
	}

	/** Raises to power. */
	pow(this: T, value: number): T {
		return this.wrap(pow(this, expr(value)))
	}

	/** Calculates square root. */
	sqrt(this: T): T {
		return this.wrap(sqrt(this))
	}

	/** Generates random number. */
	random(this: T): T {
		return this.wrap(random(this))
	}

	/** Calculates percentage of total. */
	percent(this: T, total: number): T {
		return this.wrap(div(mul(this, expr(100)), expr(total)))
	}
}

export class FilterByTextPattern<T extends Column = Column> {
	/** Filters by text pattern matches. */
	like(this: T, pattern: string): SqlNode {
		return like(this, expr(pattern))
	}

	/** Filters by Unix glob pattern matches. */
	glob(this: T, pattern: string): SqlNode {
		return glob(this, expr(pattern))
	}

	/** Filters by prefix. */
	startsWith(this: T, prefix: string): SqlNode {
		return like(this, expr(prefix + '%'))
	}

	/** Filters by suffix. */
	endsWith(this: T, suffix: string): SqlNode {
		return like(this, expr('%' + suffix))
	}

	/** Filters by substring. */
	contains(this: T, substring: string): SqlNode {
		return like(this, expr('%' + substring + '%'))
	}
}

export class TransformText<T extends Column = Column> {
	/** Converts to uppercase. */
	upper(this: T): T {
		return this.wrap(upper(this))
	}

	/** Converts to lowercase. */
	lower(this: T): T {
		return this.wrap(lower(this))
	}

	/** Gets text length. */
	length(this: T): T {
		return this.wrap(length(this))
	}

	/** Removes leading and trailing whitespace. */
	trim(this: T): T {
		return this.wrap(trim(this))
	}

	/** Removes leading whitespace. */
	ltrim(this: T): T {
		return this.wrap(ltrim(this))
	}

	/** Removes trailing whitespace. */
	rtrim(this: T): T {
		return this.wrap(rtrim(this))
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
				? substr(this, expr(start), expr(length))
				: substr(this, expr(start)),
		)
	}

	/** Replaces text occurrences. */
	replace(this: T, search: string, replacement: string): T {
		return this.wrap(replace(this, expr(search), expr(replacement)))
	}

	/** Finds substring position. */
	instr(this: T, substring: string): SqlNode {
		return instr(this, expr(substring))
	}
}

export class ExtractDate<T extends Column = Column> {
	year(this: T): T {
		return this.wrap(strftime(expr('%Y'), this))
	}

	month(this: T): T {
		return this.wrap(strftime(expr('%m'), this))
	}

	day(this: T): T {
		return this.wrap(strftime(expr('%d'), this))
	}
}

export class FormatDate<T extends Column = Column> {
	/** Extracts date part. */
	date(this: T): T {
		return this.wrap(date(this))
	}

	/** Extracts time part. */
	time(this: T): T {
		return this.wrap(time(this))
	}

	/** Converts to datetime format. */
	dateTime(this: T): T {
		return this.wrap(dateTime(this))
	}

	/** Formats datetime with custom pattern. */
	strftime(this: T, format: string): T {
		return this.wrap(strftime(expr(format), this))
	}

	/** Converts to Julian day number. */
	julianday(this: T): T {
		return this.wrap(julianday(this))
	}
}

// Common aggregates
export class Aggregate<T extends Column = Column> {
	/** Counts rows or non-null values. */
	count(this: T): T {
		return this.wrap(count(this))
	}

	/** Finds the maximum value. */
	max(this: T): T {
		return this.wrap(max(this))
	}

	/** Finds the minimum value. */
	min(this: T): T {
		return this.wrap(min(this))
	}
}

// Number column specific aggregates
export class AggregateArithmetic<T extends Column = Column> {
	/**
	 * Calculates the average value.
	 * Finds the mean across all rows in a group.
	 */
	avg(this: T): T {
		return this.wrap(avg(this))
	}

	/** Calculates the sum of values. */
	sum(this: T): T {
		return this.wrap(sum(this))
	}
}

export class Alias<T extends Column = Column> {
	/**
	 * Creates an alias for columns or expressions.
	 * Renames items in your result set.
	 */
	as(this: T, alias: string): SqlNode {
		return as_(this, id(alias))
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
		return asc(this)
	}

	/** Sorts descending. */
	desc(this: T): SqlNode {
		return desc(this)
	}
}

export class Quantify<T extends Column = Column> {
	/** Removes duplicates. */
	distinct(this: T): T {
		return this.wrap(distinct(this))
	}

	/** Includes all values. */
	all(this: T): T {
		return this.wrap(all(this))
	}
}
