import type { ArrayLike } from '~/core/utils.ts'
import type { SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    type ParameterReg,
    renderAll,
    toNode,
} from '~/core/node.ts'

// ---------------------------------------------
// Values & Assignments
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a column assignment for data modification.
 */
export class AssignmentNode implements Node {
    constructor(
        private readonly column: Node,
        private readonly value: Node,
    ) {}

    render(params: ParameterReg): SqlString {
        const col: string = this.column.render(params)
        const val: string = this.value.render(params)

        return `${col} = ${val}`
    }
}

/**
 * Represents a value list / single row for data creation.
 */
export class ValueListNode implements Node {
    constructor(private readonly values: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const values: string = renderAll(this.values, params).join(', ')

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
export const assign = (column: NodeArg, value: NodeArg): Node => {
    return new AssignmentNode(toNode(column), toNode(value))
}

/**
 * Creates a parenthesized list of values.
 * @param values The values to include in the list
 * @returns A value list node
 */
export const valueList = (...values: NodeArg[]): Node => {
    return new ValueListNode(values.map(toNode))
}
