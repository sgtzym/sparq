// deno-fmt-ignore-file
import {
    type Node,
    type NodeArg,
    type NodeFactory,
    toNode
} from '~/core/node.ts'

import {
    AGGREGATE_FUNCTIONS,
    type AggregateFunction,
    AggregateNode,
} from '~/ast-nodes/aggregates.ts'

/** SQL aggregate function node factories 🏭 */

/**
 * Creates an aggregate function node factory.
 * @param fn - Aggregate function
 * @returns Factory function for aggregate function nodes
 */
const aggregateFactory: (fn: AggregateFunction) => NodeFactory =
    (fn: AggregateFunction): NodeFactory => (arg?: NodeArg) => (): Node => {
        return new AggregateNode(fn, arg ? toNode(arg) : undefined)
    }

/**
 * AVG aggregate function
 *
 * @example
 * avg()
 * avg(distinct('column_1'))
 */
const avg: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.AVG)

/**
 * COUNT aggregate function
 *
 * @example
 * count()
 * count(distinct('column_1'))
 */
const count: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.COUNT)

/**
 * MIN aggregate function
 * @example
 * min()
 * min(distinct('column_1'))
 */
const min: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.MIN)

/**
 * MAX aggregate function
 * @example
 * max()
 * max(distinct('column_1'))
 */
const max: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.MAX)

/**
 * SUM aggregate function
 * @example
 * sum()
 * sum(distinct('column_1'))
 */
const sum: NodeFactory = aggregateFactory(AGGREGATE_FUNCTIONS.SUM)

export { avg, count, max, min, sum }
