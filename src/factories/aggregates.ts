import { type Node, type NodeExpr, toNode } from '~/core/node.ts'
import {
    AGGREGATE_FUNCTIONS,
    type AggregateFunction,
    AggregateNode,
} from '~/ast-nodes/aggregates.ts'

/** 🏭 Node factories: Aggregate functions */

const aggregate = (fn: AggregateFunction) => (expr?: NodeExpr): Node =>
    new AggregateNode(fn, expr ? toNode(expr) : undefined)

/**
 * 🏭 ...
 * @param {NodeExpr} expr
 */
export const avg = aggregate(AGGREGATE_FUNCTIONS.AVG)

/**
 * 🏭 ...
 * @param {NodeExpr} expr
 */
export const count = aggregate(AGGREGATE_FUNCTIONS.COUNT)

/**
 * 🏭 ...
 * @param {NodeExpr} expr
 */
export const max = aggregate(AGGREGATE_FUNCTIONS.MAX)

/**
 * 🏭 ...
 * @param {NodeExpr} expr
 */
export const min = aggregate(AGGREGATE_FUNCTIONS.MIN)

/**
 * 🏭 ...
 * @param {NodeExpr} expr
 */
export const sum = aggregate(AGGREGATE_FUNCTIONS.SUM)
