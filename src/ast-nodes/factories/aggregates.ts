import { type Node, type NodeArg, type NodeFactory, toNode } from '~/core/node.ts'
import {
    AGGREGATE_FUNCTIONS,
    type AggregateFunction,
    AggregateNode,
} from '~/ast-nodes/aggregates.ts'

const aggregateFactory = (fn: AggregateFunction): NodeFactory => (arg?: NodeArg) => (): Node => {
    return new AggregateNode(fn, arg ? toNode(arg) : undefined)
}

const avg = aggregateFactory(AGGREGATE_FUNCTIONS.AVG)
const count = aggregateFactory(AGGREGATE_FUNCTIONS.COUNT)
const min = aggregateFactory(AGGREGATE_FUNCTIONS.MIN)
const max = aggregateFactory(AGGREGATE_FUNCTIONS.MAX)
const sum = aggregateFactory(AGGREGATE_FUNCTIONS.SUM)

export { avg, count, max, min, sum }
