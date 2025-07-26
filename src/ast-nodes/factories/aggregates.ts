import { SQL_SYMBOLS } from '~/core/sql-constants.ts'
import { RawNode } from '~/ast-nodes/primitives.ts'
import { type Node, type NodeArg, type NodeFactory, toNode } from '~/core/node.ts'
import {
    AGGREGATE_FUNCTIONS,
    type AggregateFunction,
    AggregateNode,
} from '~/ast-nodes/aggregates.ts'

const aggregateFactory = (fn: AggregateFunction): NodeFactory => (arg?: NodeArg) => (): Node => {
    const node = arg
        ? toNode(arg)
        : fn === AGGREGATE_FUNCTIONS.COUNT
        ? new RawNode(SQL_SYMBOLS.ALL)
        : new RawNode('1')
    return new AggregateNode(fn, node)
}

const avg: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.AVG)
const count: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.COUNT)
const min: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.MIN)
const max: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.MAX)
const sum: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.SUM)

export { avg, count, max, min, sum }
