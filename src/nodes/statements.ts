import { type ArrayLike, castArray } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { isSqlNode, renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Statements
// ---------------------------------------------

// -> 🔷 Nodes

export class SelectNode extends SqlNode {
	override _priority: number = 0

	constructor(private readonly columns: ArrayLike<SqlNode>) {
		super()
	}

	render(params: ParameterReg): SqlString {
		const _columns: SqlString = renderSqlNodes(this.columns, params).join(
			', ',
		)

		return `${sql('SELECT')} ${_columns}`
	}
}

export class InsertNode extends SqlNode {
	override _priority: number = 0

	constructor(
		private readonly table: SqlNode,
		private readonly columns: ArrayLike<SqlNode>,
	) {
		super()
	}

	render(params: ParameterReg): SqlString {
		const table: string = this.table.render(params)

		// Removes table qualified names
		const cols: string = castArray(this.columns).map((col) => {
			const rendered = col.render(params)
			const parts = rendered.split('.')
			return parts.length > 1 ? parts[parts.length - 1] : rendered
		}).join(', ')

		return `${sql('INSERT')} ${sql('INTO')} ${table} (${cols})`
	}
}

export class UpdateNode extends SqlNode {
	override _priority: number = 0

	constructor(private readonly table: SqlNode) {
		super()
	}

	render(params: ParameterReg): SqlString {
		const table: string = this.table.render(params)

		return `${sql('UPDATE')} ${table}`
	}
}

export class DeleteNode extends SqlNode {
	override _priority: number = 0

	constructor() {
		super()
	}

	render(_params: ParameterReg): SqlString {
		return sql('DELETE')
	}
}

// -> 🏭 Factories

/**
 * Retrieves data from tables.
 * Specifies which columns to select or uses * for all.
 *
 * @param columns - The columns to select (defaults to * if empty)
 */
export const _select = (columns?: SqlNodeValue[]): SqlNode => {
	if (!columns || columns.length === 0) {
		return new SelectNode(raw('*'))
	}

	const _columns: SqlNode[] = columns.map((col) => isSqlNode(col) ? col : id(col))

	return new SelectNode(_columns)
}

/**
 * Adds new records to a table.
 * Specifies the table and columns for insertion.
 */
export const _insert = (table: string, columns: SqlNodeValue[]): SqlNode =>
	new InsertNode(id(table), columns.map(expr))

/**
 * Modifies existing records in a table.
 * Specifies the table for updates.
 */
export const _update = (table: string): SqlNode => new UpdateNode(id(table))

/**
 * Removes records from tables.
 */
export const _delete = (): SqlNode => new DeleteNode()
