import {
	applyMixins,
	ParameterReg,
	renderSqlNodes,
	sql,
	type SqlDataType,
	SqlNode,
	type SqlNodeValue,
	type SqlString,
} from '~core'
import {
	_create,
	_delete,
	_insert,
	_select,
	_update,
	AssignmentNode,
	cte,
	expr,
	from,
	raw,
	set,
	valueList,
	values,
	with_,
} from '~node'
import { Filter, Group, Join, Resolve, Return } from '~api'

// ---------------------------------------------
// Base query builder
// ---------------------------------------------

/**
 * Base SQL query builder.
 * Manages query construction and parameter binding.
 */
export abstract class SqlQueryBuilder extends SqlNode {
	protected _parts: SqlNode[] = []
	protected _params?: ParameterReg
	protected _cache?: { sql: string; params: readonly SqlDataType[] }

	constructor() {
		super()
	}

	render(): SqlString {
		this._params = new ParameterReg()
		const sql: SqlString = renderSqlNodes(this._parts, this._params, true)
			.join(' ')
		this._cache = { sql, params: this._params.toArray() }
		return sql
	}

	/**
	 * Adds a SQL clause or node to the query.
	 * Mutable accumulation - collect SQL parts as array.
	 */
	add(part: SqlNode): this {
		this._parts.push(part)
		this._cache = undefined
		return this
	}

	/** Returns generated SQL string. */
	get sql(): SqlString {
		return this._cache ? this._cache.sql : this.render()
	}

	/** Returns parameter values in order. */
	get params(): readonly SqlDataType[] {
		if (!this._cache) this.render()
		return this._cache!.params
	}

	/** Adds CTEs to query. */
	with(name: string, query: Select, recursive?: boolean): this {
		return this.add(with_(recursive, cte(name, query._parts)))
	}
}

// ---------------------------------------------
// Top-level builders
// ---------------------------------------------

export class Select extends SqlQueryBuilder {
	constructor(
		private readonly table: string,
		private readonly columns?: SqlNodeValue[],
	) {
		super()

		this.add(_select(this.columns))
		this.add(from(this.table))
	}

	/**
	 * Override render to add parentheses when used as a subquery.
	 * This is detected by checking if a ParameterReg is passed in.
	 */
	override render(params?: ParameterReg): SqlString {
		return params ? `(${renderSqlNodes(this._parts, params).join(' ')})` : super.render()
	}

	private _combineQuery(op: string, query: SqlNodeValue): Select {
		const combined = new Select('', [])
		combined._parts = []
		combined._parts.push(this)
		combined._parts.push(raw(sql(op)))
		combined._parts.push(expr(query))
		return combined
	}

	/**
	 * Combines rows from both queries.
	 * @param {SqlNodeValue} query - The union target
	 * @param {boolean} [all] - Includes duplicate rows, if true
	 */
	union(query: SqlNodeValue, all?: boolean): Select {
		return this._combineQuery(all ? sql('UNION ALL') : sql('UNION'), query)
	}

	/**
	 * Returns rows that appear in both queries.
	 * @param {SqlNodeValue} query - The intersection target
	 */
	intersect(query: SqlNodeValue): Select {
		return this._combineQuery(sql('INTERSECT'), query)
	}

	/**
	 * Excludes rows that appear in the specified query.
	 * @param {SqlNodeValue} query - The exclusion target
	 */
	except(query: SqlNodeValue): Select {
		return this._combineQuery(sql('EXCEPT'), query)
	}
}

export class Insert extends SqlQueryBuilder {
	private readonly _values = values()

	constructor(
		private readonly table: string,
		private readonly columns: SqlNodeValue[],
	) {
		super()
		this.add(_insert(this.table, this.columns))
		this.add(this._values)
	}

	/**
	 * Creates a VALUES clause for specifying explicit row data.
	 * Use this to define the actual data for INSERT operations.
	 */
	values(...args: SqlNodeValue[]): this {
		if (args.length !== this.columns.length) {
			throw new Error(
				`Insert requires ${this.columns.length} values. Received ${args.length}.`,
			)
		}

		this._values.addRow(valueList(...args))

		return this
	}
}

export class Update extends SqlQueryBuilder {
	private readonly assignments: SqlNode[] = []

	constructor(
		private readonly table: string,
		assignments: SqlNodeValue[],
	) {
		super()

		this.add(_update(this.table))

		for (const assign of assignments) {
			if (assign instanceof AssignmentNode) {
				this.assignments.push(assign)
			}
		}

		this.add(set(...this.assignments))
	}
}

export class Delete extends SqlQueryBuilder {
	constructor(private readonly table: string) {
		super()
		this.add(_delete())
		this.add(from(this.table))
	}
}

export class Create extends SqlQueryBuilder {
	constructor(
		private readonly table: string,
		private readonly columnDefs: SqlNode[],
		private readonly options?: {
			ifNotExists?: boolean
			withoutRowid?: boolean
		},
	) {
		super()
		this.add(_create(this.table, this.columnDefs, this.options))
	}
}

// Apply mixins
applyMixins(Select, [Join, Filter, Group])
applyMixins(Insert, [Resolve, Return])
applyMixins(Update, [Filter, Resolve, Return])
applyMixins(Delete, [Filter, Return])

// Interfaces for TypeScript auto-completion
export interface Select extends Join<Select>, Filter<Select>, Group<Select> {}

export interface Insert extends Resolve<Insert>, Return<Insert> {}

export interface Update extends Filter<Update>, Resolve<Update>, Return<Update> {}

export interface Delete extends Filter<Delete>, Return<Delete> {}
