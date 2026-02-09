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

/** Column Options for Schema Generation */
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
	/** Foreign key reference */
	references?: {
		table: string
		column: string
		onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'NO ACTION'
		onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'NO ACTION'
	}
}

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
	protected _qualified = false

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

		const identifier = this._qualified && this._table
			? `${this._table}.${this._name}`
			: this._name

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

	/**
	 * Returns a table-qualified version of this column (e.g. `table.column`).
	 * Use in JOINs to disambiguate columns from different tables.
	 */
	get q(): this {
		const qualified = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
		qualified._qualified = true
		return qualified
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

/** Creates a number column. */
export class NumberColumn<TName extends string = string> extends Column<TName, number> {
	override get sqlType(): string {
		return 'INTEGER'
	}
}

/** Creates a text column. */
export class TextColumn<TName extends string = string> extends Column<TName, string> {
	override get sqlType(): string {
		return 'TEXT'
	}
}

/** Creates a date-time (ISO 8601 TEXT) column. */
export class DateTimeColumn<TName extends string = string> extends Column<TName, Date | string> {
	override get sqlType(): string {
		return 'TEXT'
	}
}

/** Creates a boolean (0/1) column. */
export class BooleanColumn<TName extends string = string> extends Column<TName, boolean> {
	override get sqlType(): string {
		return 'INTEGER'
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

/** Maps column types to primitives. */
export type ColumnTypeMapping<K extends string, T> = T extends ColumnDescriptor<'number'>
	? NumberColumn<K>
	: T extends ColumnDescriptor<'text'> ? TextColumn<K>
	: T extends ColumnDescriptor<'date'> ? DateTimeColumn<K>
	: T extends ColumnDescriptor<'boolean'> ? BooleanColumn<K>
	: T extends ColumnDescriptor<'list'> ? Column<K, Uint8Array | null>
	: T extends ColumnDescriptor<'json'> ? Column<K, Record<string, any> | undefined>
	: Column<K, any>

type ColumnDescriptor<T extends string> = { type: T; opts?: ColumnOptions }

/** Column API interface */
export const column = {
	number: (options?: ColumnOptions): ColumnDescriptor<'number'> => ({
		type: 'number',
		opts: options,
	}),
	text: (options?: ColumnOptions): ColumnDescriptor<'text'> => ({
		type: 'text',
		opts: options,
	}),
	boolean: (options?: ColumnOptions): ColumnDescriptor<'boolean'> => ({
		type: 'boolean',
		opts: options,
	}),
	date: (options?: ColumnOptions): ColumnDescriptor<'date'> => ({
		type: 'date',
		opts: options,
	}),
	list: (options?: ColumnOptions): ColumnDescriptor<'list'> => ({
		type: 'list',
		opts: options,
	}),
	json: (options?: ColumnOptions): ColumnDescriptor<'json'> => ({
		type: 'json',
		opts: options,
	}),
} as const
