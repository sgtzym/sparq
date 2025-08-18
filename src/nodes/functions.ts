import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Functions
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents an aggregate function with optional expression.
 */
export class FnNode extends SqlNode {
    constructor(
        private readonly name: SqlNode,
        private readonly expr: ArrayLike<SqlNode>,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _name: string = this.name.render(params)
        const _expr: string = renderSqlNodes(this.expr, params).join(', ')

        return `${_name}(${_expr ?? ''})`
    }
}

// -> 🏭 Factories

/**
 * Creates a function factory.
 * @param name - The fn name
 * @param args - The expression arguments
 * @returns A function that creates fn nodes
 */
const fn = (name: string) => (...args: SqlNodeValue[]) =>
    new FnNode(raw(name), args.map(expr))

/**
 * Creates an aggregate function factory.
 * @param name - The fn name
 * @param column - The column name, defaults to * if empty
 * @returns A function that creates aggregate nodes
 */
const aggregate = (name: string) => (column?: SqlNodeValue) =>
    new FnNode(raw(name), column ? id(column) : raw('*'))

// Aggregate functions (can use *)
export const avg = aggregate(sql('AVG'))
export const count = aggregate(sql('COUNT'))
export const max = aggregate(sql('MAX'))
export const min = aggregate(sql('MIN'))
export const sum = aggregate(sql('SUM'))

// String functions (require args)
export const upper = fn(sql('UPPER'))
export const lower = fn(sql('LOWER'))
export const length = fn(sql('LENGTH'))
export const trim = fn(sql('TRIM'))
export const ltrim = fn(sql('LTRIM'))
export const rtrim = fn(sql('RTRIM'))
export const substr = fn(sql('SUBSTR'))
export const replace = fn(sql('REPLACE'))
export const instr = fn(sql('INSTR'))

// Date/Time functions
export const date = fn(sql('DATE'))
export const time = fn(sql('TIME'))
export const dateTime = fn(sql('DATETIME'))
export const strftime = fn(sql('STRFTIME'))
export const julianday = fn(sql('JULIANDAY'))

// Math functions
export const abs = fn(sql('ABS'))
export const round = fn(sql('ROUND'))
export const ceil = fn(sql('CEIL'))
export const floor = fn(sql('FLOOR'))
export const mod = fn(sql('MOD'))
export const pow = fn(sql('POWER'))
export const sqrt = fn(sql('SQRT'))
export const random = fn(sql('RANDOM'))
