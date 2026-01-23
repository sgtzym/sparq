import {
	type OneOrMany,
	type ParameterReg,
	renderSqlNodes,
	sql,
	SqlNode,
	type SqlNodeValue,
	type SqlString,
} from '~core'
import { expr, raw } from '~node'

// ---------------------------------------------
// Functions
// ---------------------------------------------

// -> 🔷 Nodes

export class FnNode extends SqlNode {
	constructor(
		private readonly name: SqlNode,
		private readonly expr: OneOrMany<SqlNode>,
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

const fn = (name: string) => (...args: SqlNodeValue[]) => new FnNode(raw(name), args.map(expr))

const aggregate = (name: string) => (column?: SqlNodeValue) =>
	new FnNode(raw(name), column ? expr(column) : raw('*'))

// → Aggregate functions

/**
 * Calculates the average value.
 * Finds the mean across all rows in a group.
 *
 * @example
 * ```ts
 * avg(user.age) // AVG(user.age)
 * ```
 */
export const avg = aggregate(sql('AVG'))

/**
 * Counts rows or non-null values.
 *
 * @example
 * ```ts
 * count(user.id) // COUNT(user.id)
 * count()        // COUNT(*)
 * ```
 */
export const count = aggregate(sql('COUNT'))

/** Finds the maximum value. */
export const max = aggregate(sql('MAX'))

/** Finds the minimum value. */
export const min = aggregate(sql('MIN'))

/** Calculates the sum of values. */
export const sum = aggregate(sql('SUM'))

// → String functions (require args)

/** Converts to uppercase. */
export const upper = fn(sql('UPPER'))

/** Converts to lowercase. */
export const lower = fn(sql('LOWER'))

/** Gets text length. */
export const length = fn(sql('LENGTH'))

/** Removes leading and trailing whitespace. */
export const trim = fn(sql('TRIM'))

/** Removes leading whitespace. */
export const ltrim = fn(sql('LTRIM'))

/** Removes trailing whitespace. */
export const rtrim = fn(sql('RTRIM'))

/**
 * Extracts substring.
 *
 * @example
 * ```ts
 * substr(user.name, 1, 5) // First 5 characters
 * ```
 */
export const substr = fn(sql('SUBSTR'))

/** Replaces text occurrences. */
export const replace = fn(sql('REPLACE'))

/** Finds substring position. */
export const instr = fn(sql('INSTR'))

// → Date/Time functions

/** Extracts date part. */
export const date = fn(sql('DATE'))

/** Extracts time part. */
export const time = fn(sql('TIME'))

/** Converts to datetime format. */
export const dateTime = fn(sql('DATETIME'))

/**
 * Formats datetime with custom pattern.
 *
 * @example
 * ```ts
 * strftime('%Y-%m-%d', user.createdAt)
 * ```
 */
export const strftime = fn(sql('STRFTIME'))

/** Converts to Julian day number. */
export const julianday = fn(sql('JULIANDAY'))

// → Math functions

/** Returns absolute value. */
export const abs = fn(sql('ABS'))

/** Rounds to decimal places. */
export const round = fn(sql('ROUND'))

/** Rounds up to integer. */
export const ceil = fn(sql('CEIL'))

/** Rounds down to integer. */
export const floor = fn(sql('FLOOR'))

/** Returns division remainder. */
export const mod = fn(sql('MOD'))

/** Raises to power. */
export const pow = fn(sql('POWER'))

/** Calculates square root. */
export const sqrt = fn(sql('SQRT'))

/** Generates random number. */
export const random = fn(sql('RANDOM'))

// → Null handling

/** Returns NULL if arguments are equal. */
export const nullIf = fn(sql('NULLIF'))

/** Returns the first non-NULL argument. */
export const ifNull = fn(sql('IFNULL'))

/** Returns the first non-NULL argument. */
export const coalesce = fn(sql('COALESCE'))
