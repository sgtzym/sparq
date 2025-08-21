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
 * Represents a column assignment for UPDATE operations.
 * Used to specify which column gets which value during data modification.
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
 * Represents a parenthesized list of values for INSERT or IN operations.
 * Used to group multiple values together in SQL statements.
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
 * Use this to specify how columns should be updated with new values.
 *
 * @example
 * ```ts
 * // user.email = 'new@example.com'
 * assign(user.email, 'new@example.com')
 *
 * // product.price = product.price * 1.1
 * assign(product.price, mul(product.price, 1.1))
 * ```
 */
export const assign = (column: SqlNodeValue, value: SqlNodeValue): SqlNode => {
    return new AssignmentNode(id(column), expr(value))
}

/**
 * Creates a parenthesized list of values.
 * Use this for INSERT VALUES clauses or IN comparisons.
 *
 * @example
 * ```ts
 * valueList('John', 25, 'admin') // ('John', 25, 'admin')
 * valueList(1, 2, 3, 4, 5)       // (1, 2, 3, 4, 5)
 *
 * // Usage in INSERT
 * users.insert('name', 'age', 'role')
 *   .values('John', 25, 'admin')
 * ```
 */
export const valueList = (...values: SqlNodeValue[]): SqlNode => {
    return new ValueListNode(values.map(expr))
}
