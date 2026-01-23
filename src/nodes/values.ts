import type { ArrayLike } from '~/core/utils.ts'
import type { SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Values & Assignments
// ---------------------------------------------

// -> 🔷 Nodes

export class AssignmentNode extends SqlNode {
	constructor(
		private readonly column: SqlNode,
		private readonly value: SqlNode,
	) {
		super()
	}

	render(params: ParameterReg): SqlString {
		const col: string = this.column.render(params)
		const val: string = this.value.render(params)

		return `${col} = ${val}`
	}
}

export class ValueListNode extends SqlNode {
	constructor(private readonly values: ArrayLike<SqlNode>) {
		super()
	}

	render(params: ParameterReg): SqlString {
		const values: string = renderSqlNodes(this.values, params).join(', ')

		return `(${values})`
	}
}

// -> 🏭 Factories

/** Assigns value. */
export const assign = (column: SqlNodeValue, value: SqlNodeValue): SqlNode => {
	return new AssignmentNode(id(column), expr(value))
}

/** Groups values in parentheses. */
export const valueList = (...values: SqlNodeValue[]): SqlNode => {
	return new ValueListNode(values.map(expr))
}
