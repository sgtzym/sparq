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
// Column Options for Schema Generation
// ---------------------------------------------

export interface ColumnOptions {
	/** Column cannot be NULL */
	notNull?: boolean
	/** Default value for the column */
	default?: string | number | boolean | null
	/** Column is a PRIMARY KEY */
	primaryKey?: boolean
	/** Column must be UNIQUE */
	unique?: boolean
	/** Auto-increment (only for INTEGER PRIMARY KEY) */
	autoIncrement?: boolean
	/** Check constraint */
	check?: string
}

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
		protected readonly _options?: ColumnOptions,
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

	/** Gets the column name without table prefix */
	get name(): string {
		return this._name
	}

	/** Gets the column's constraint options for schema generation */
	get options(): ColumnOptions | undefined {
		return this._options
	}

	/** Gets the SQL type name for schema generation */
	get sqlType(): string {
		return 'TEXT' // Overridden in subclasses
	}
}

export class NumberColumn<TName extends string = string> extends Column<TName, number> {
	override get sqlType(): string {
		return 'INTEGER'
	}
}

export class TextColumn<TName extends string = string> extends Column<TName, string> {
	override get sqlType(): string {
		return 'TEXT'
	}
}

export class DateTimeColumn<TName extends string = string> extends Column<TName, Date | string> {
	override get sqlType(): string {
		return 'TEXT' // ISO 8601 TEXT
	}
}

export class BooleanColumn<TName extends string = string> extends Column<TName, boolean> {
	override get sqlType(): string {
		return 'INTEGER' // 0/1
	}
}

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
 *   id: column.number({ primaryKey: true, autoIncrement: true }),
 *   name: column.text({ notNull: true }),
 *   active: column.boolean({ default: true })
 * })
 * ```
 */
export const column = {
	number: (options?: ColumnOptions): number => {
		const value = new Number(0) as any
		if (options) (value as any).__columnOptions = options
		return value
	},
	text: (options?: ColumnOptions): string => {
		const value = new String('') as any
		if (options) (value as any).__columnOptions = options
		return value
	},
	boolean: (options?: ColumnOptions): boolean => {
		const value = new Boolean(true) as any
		if (options) (value as any).__columnOptions = options
		return value
	},
	date: (options?: ColumnOptions): Date => {
		const value = new Date()
		if (options) (value as any).__columnOptions = options
		return value
	},
	list: (options?: ColumnOptions): Uint8Array | null => {
		const value = {} as any
		if (options) (value as any).__columnOptions = options
		return value
	},
	json: (options?: ColumnOptions): Record<string, any> | undefined => {
		const value = {} as any
		if (options) (value as any).__columnOptions = options
		return value
	},
} as const
