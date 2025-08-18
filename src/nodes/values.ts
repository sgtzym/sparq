import type { ArrayLike } from '~/core/utils.ts'
import type { SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Values & Assignments
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a column assignment for data modification.
 */
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

/**
 * Represents a value list / single row for data creation.
 */
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

/**
 * Creates a column assignment for UPDATE operations.
 * @param column The column to assign to
 * @param value The value to assign
 * @returns An assignment node
 */
export const assign = (column: SqlNodeValue, value: SqlNodeValue): SqlNode => {
    return new AssignmentNode(id(column), expr(value))
}

/**
 * Creates a parenthesized list of values.
 * @param values The values to include in the list
 * @returns A value list node
 */
export const valueList = (...values: SqlNodeValue[]): SqlNode => {
    return new ValueListNode(values.map(expr))
}
