import { applyMixins, needsQuoting, type ParameterReg, SqlNode, type SqlParam } from '~core'
import {
	Aggregate,
	AggregateArithmetic,
	Alias,
	Assign,
	ComputeByArithmetic,
	ComputeByMath,
	ExtractDate,
	FilterByComparison,
	FilterByEquality,
	FilterByInclusion,
	FilterByNull,
	FilterByTextPattern,
	FormatDate,
	Quantify,
	Sort,
	TransformText,
} from '~api'

// ---------------------------------------------
// Column API
// ---------------------------------------------

/**
 * Base column class with common SQL operations.
 * Provides core functionality available to all column types including
 * comparisons, null checks, aliasing, and basic aggregates.
 */
export class Column<
	TName extends string = string,
	TType extends SqlParam = SqlParam,
> extends SqlNode {
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

		const identifier = this._table ? `${this._table}.${this._name}` : this._name

		return identifier.split('.')
			.map((p) => needsQuoting(p) ? `"${p}"` : p)
			.join('.')
	}

	/**
	 * Creates a new column instance wrapping the given node.
	 * Immutable chaining: Preserves the column's metadata for method chaining.
	 */
	protected wrap<T extends Column<TName, TType>>(node: SqlNode): T {
		// Copies the original constructor and just replaces _node.
		const wrapped = Object.assign(Object.create(Object.getPrototypeOf(this)), this) as T
		wrapped._node = node
		return wrapped
	}
}

export class NumberColumn<TName extends string = string> extends Column<TName, number> {}
export class TextColumn<TName extends string = string> extends Column<TName, string> {}
export class DateTimeColumn<TName extends string = string> extends Column<TName, Date | string> {}
export class BooleanColumn<TName extends string = string> extends Column<TName, boolean> {}

applyMixins(Column, [
	Aggregate,
	Alias,
	Assign,
	FilterByEquality,
	FilterByInclusion,
	FilterByNull,
	Quantify,
	Sort,
])

applyMixins(NumberColumn, [
	AggregateArithmetic,
	ComputeByArithmetic,
	ComputeByMath,
	FilterByComparison,
])

applyMixins(TextColumn, [
	FilterByTextPattern,
	TransformText,
])

applyMixins(DateTimeColumn, [
	ExtractDate,
	FilterByComparison,
	FormatDate,
])

export interface Column
	extends
		Aggregate<Column>,
		Alias<Column>,
		Assign<Column>,
		FilterByEquality<Column>,
		FilterByInclusion<Column>,
		FilterByNull<Column>,
		Quantify<Column>,
		Sort<Column>
{}

export interface NumberColumn
	extends
		AggregateArithmetic<NumberColumn>,
		ComputeByArithmetic<NumberColumn>,
		ComputeByMath<NumberColumn>,
		FilterByComparison<NumberColumn>
{}

export interface TextColumn extends FilterByTextPattern<TextColumn>, TransformText<TextColumn> {}

export interface DateTimeColumn
	extends
		ExtractDate<DateTimeColumn>,
		FilterByComparison<DateTimeColumn>,
		FormatDate<DateTimeColumn>
{}

export type ColumnTypeMapping<K extends string, T extends SqlParam> = T extends number
	? NumberColumn<K>
	: T extends string ? TextColumn<K>
	: T extends Date ? DateTimeColumn<K>
	: T extends boolean ? BooleanColumn<K>
	: T extends Record<string, any> ? Column<K, T> // Fallback for JSON
	: T extends Uint8Array ? Column<K, T>
	: T extends null ? Column<K, T>
	: Column<K, T>

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
export const column = {
	number: (): number => 0,
	text: (): string => '',
	boolean: (): boolean => true,
	date: (): Date => new Date(),
	list: (): Uint8Array | null => null,
	json: (): Record<string, any> | undefined => undefined,
} as const
