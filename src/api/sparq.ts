import type { SqlNodeValue, SqlParam } from '~core'
import {
	BooleanColumn,
	Column,
	type ColumnOptions,
	type ColumnTypeMapping,
	Create,
	DateTimeColumn,
	Delete,
	Insert,
	NumberColumn,
	Select,
	TextColumn,
	Update,
} from '~api'
import { columnDef, id, tableConstraint } from '~node'

// ---------------------------------------------
// Schema Generation Options
// ---------------------------------------------

export interface CreateTableOptions {
	/** Add IF NOT EXISTS clause (default: true) */
	ifNotExists?: boolean
	/** Override primary key (if not defined in columns) */
	primaryKey?: string | string[]
	/** Add WITHOUT ROWID optimization */
	withoutRowid?: boolean
}

// ---------------------------------------------
// Sparq Class
// ---------------------------------------------

/**
 * Type-safe query builder for SQLite tables.
 * Provides schema-aware column access and query operations.
 */
export class Sparq<T extends Record<string, any>> {
	public readonly table: string
	private readonly _$: { [P in keyof T]: ColumnTypeMapping<string & P, T[P]> }

	constructor(table: string, schema: T) {
		this.table = table
		this._$ = {} as any

		// Instanciate schema based columns
		for (const [name, descriptor] of Object.entries(schema)) {
			const options = (descriptor as any)?.__options as ColumnOptions | undefined
			const type = (descriptor as any)?.__type

			let column: Column<string, SqlParam>

			switch (type) {
				case 'number':
					column = new NumberColumn(name, table, 0, options)
					break
				case 'text':
					column = new TextColumn(name, table, '', options)
					break
				case 'date':
					column = new DateTimeColumn(name, table, new Date(), options)
					break
				case 'boolean':
					column = new BooleanColumn(name, table, true, options)
					break
				case 'list':
					column = new Column(name, table, null, options)
					break
				case 'json':
					column = new Column(name, table, undefined, options)
					break
				default:
					// Fallback für alte API compatibility
					column = new Column(name, table, descriptor, options)
			}

			;(this._$ as any)[name] = column
		}
	}

	/** Retrieves data from table. */
	select(...columns: SqlNodeValue[]): Select {
		return new Select(this.table, columns)
	}

	/** Adds new records. */
	insert(
		...columns: (keyof T | Column<string, SqlParam> | SqlNodeValue)[]
	): Insert {
		const cols = columns.map((col) => typeof col === 'string' ? id(col) : col)
		return new Insert(this.table, cols as SqlNodeValue[])
	}

	/** Modifies existing records. */
	update(assignments: Partial<T> | SqlNodeValue[]): Update {
		const assigns = Array.isArray(assignments)
			? assignments
			: Object.entries(assignments).map(([col, val]) => this.$[col as keyof T].to(val))
		return new Update(this.table, assigns)
	}

	/** Removes records. */
	delete(): Delete {
		return new Delete(this.table)
	}

	/** Creates a table schema. */
	create(options?: CreateTableOptions): Create {
		const { ifNotExists = true, primaryKey, withoutRowid = false } = options ?? {}

		const columnDefs: ReturnType<typeof columnDef>[] = []
		const tableConstraints: ReturnType<typeof tableConstraint>[] = []

		// Build column definitions
		for (const [name, col] of Object.entries(this._$)) {
			const column = col as Column
			const opts = column.options
			const constraints: string[] = []

			// PRIMARY KEY constraint
			if (opts?.primaryKey) {
				constraints.push('PRIMARY KEY')
				if (opts?.autoIncrement && column.sqlType === 'INTEGER') {
					constraints.push('AUTOINCREMENT')
				}
			}

			// NOT NULL constraint
			if (opts?.notNull) {
				constraints.push('NOT NULL')
			}

			// UNIQUE constraint
			if (opts?.unique && !opts?.primaryKey) {
				constraints.push('UNIQUE')
			}

			// DEFAULT constraint
			if (opts?.default !== undefined) {
				const defaultValue = typeof opts.default === 'string'
					? opts.default.toUpperCase() === 'CURRENT_TIMESTAMP'
						? 'CURRENT_TIMESTAMP'
						: `'${opts.default}'`
					: opts.default === null
					? 'NULL'
					: opts.default
				constraints.push(`DEFAULT ${defaultValue}`)
			}

			// CHECK constraint
			if (opts?.check) {
				constraints.push(`CHECK (${opts.check})`)
			}

			columnDefs.push(columnDef(name, column.sqlType, constraints))
		}

		// Add table-level PRIMARY KEY if specified
		if (primaryKey) {
			if (Array.isArray(primaryKey)) {
				tableConstraints.push(tableConstraint(`PRIMARY KEY (${primaryKey.join(', ')})`))
			} else {
				// Check if column already has primaryKey option
				const col = this._$[primaryKey as keyof T] as Column
				if (!col.options?.primaryKey) {
					tableConstraints.push(tableConstraint(`PRIMARY KEY (${primaryKey})`))
				}
			}
		}

		return new Create(this.table, [...columnDefs, ...tableConstraints], {
			ifNotExists,
			withoutRowid,
		})
	}

	get $(): { [P in keyof T]: ColumnTypeMapping<string & P, T[P]> } {
		return this._$
	}
}

/**
 * Creates a type-safe table query builder.
 *
 * @param tableName - Database table name
 * @param schema - Column definitions using SqlType
 * @returns Schema-aware query builder
 *
 * @example
 * ```ts
 * const users = sparq('users', {
 *   id: SqlType.number(),
 *   email: SqlType.text(),
 *   active: SqlType.boolean()
 * })
 *
 * users
 *   .select(users.$.email)
 *   .where(users.$.active.eq(true))
 * ```
 */
export function sparq<const TSchema extends Record<string, any>>(
	tableName: string,
	schema: TSchema,
): Sparq<TSchema> {
	return new Sparq(tableName, schema as any)
}

/** Maps a ColumnDescriptor to its corresponding JavaScript value type. */
type MapColumnToValue<T> = T extends { __type: 'number' } ? number
	: T extends { __type: 'text' } ? string
	: T extends { __type: 'boolean' } ? boolean
	: T extends { __type: 'date' } ? Date
	: T extends { __type: 'list' } ? Uint8Array | null
	: T extends { __type: 'json' } ? Record<string, any> | undefined
	: T

/**
 * Extracts the row-type from a Sparq instance.
 *
 * @example
 * ```ts
 * const users = sparq('users', { id: column.number(), name: column.text() })
 * type User = Rec<typeof users>  // → { id: number, name: string }
 * ```
 */
export type Rec<TSchema> = TSchema extends Sparq<infer TRow>
	? { [K in keyof TRow]: MapColumnToValue<TRow[K]> }
	: never
