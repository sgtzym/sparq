import { type NodeExpr, type Node, toNode } from '~/core/node.ts'
import {
    AGGREGATE_FUNCTIONS,
    type AggregateFunction,
    AggregateNode,
} from '~/ast-nodes/aggregates.ts'

/** 🏭 Node factories: Aggregate functions */

const aggregate = (fn: AggregateFunction) => (expr?: NodeExpr): Node =>
    new AggregateNode(fn, expr ? toNode(expr) : undefined)

export const avg = aggregate(AGGREGATE_FUNCTIONS.AVG)
export const count = aggregate(AGGREGATE_FUNCTIONS.COUNT)
export const max = aggregate(AGGREGATE_FUNCTIONS.MAX)
export const min = aggregate(AGGREGATE_FUNCTIONS.MIN)
export const sum = aggregate(AGGREGATE_FUNCTIONS.SUM)
