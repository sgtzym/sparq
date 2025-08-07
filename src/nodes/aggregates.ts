import { sql, type SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    type ParameterReg,
    toNode,
} from '~/core/node.ts'
import { raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Aggregate Functions
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents an aggregate function with optional expression.
 */
export class AggregateNode implements Node {
    constructor(
        private readonly fn: Node,
        private readonly expr?: Node,
    ) {}

    render(params: ParameterReg): SqlString {
        const fn: string = this.fn.render(params)
        const expr: string = this.expr?.render(params)

        return this.expr ? `${fn}(${expr})` : `${fn}(*)`
    }
}

// -> 🏭 Factories

/**
 * Creates an aggregate function factory.
 * @param fn The aggregate function name
 * @returns A function that creates aggregate nodes
 */
const aggregate = (fn: string) => (expr?: NodeArg): Node =>
    new AggregateNode(raw(fn), expr ? toNode(expr) : undefined)

/**
 * Creates an AVG aggregate function.
 * @param expr The optional expression to average
 * @returns An aggregate node
 */
export const avg = aggregate(sql('AVG'))

/**
 * Creates a COUNT aggregate function.
 * @param expr The optional expression to count
 * @returns An aggregate node
 */
export const count = aggregate(sql('COUNT'))

/**
 * Creates a MAX aggregate function.
 * @param expr The optional expression to find maximum of
 * @returns An aggregate node
 */
export const max = aggregate(sql('MAX'))

/**
 * Creates a MIN aggregate function.
 * @param expr The optional expression to find minimum of
 * @returns An aggregate node
 */
export const min = aggregate(sql('MIN'))

/**
 * Creates a SUM aggregate function.
 * @param expr The optional expression to sum
 * @returns An aggregate node
 */
export const sum = aggregate(sql('SUM'))
