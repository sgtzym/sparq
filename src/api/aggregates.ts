import {
    type Node,
    type NodeArg,
    type NodeConstructor,
    toNode,
} from '~/core/node.ts'

import { RawNode } from '~/nodes/primitives.ts'

import { AggregateFunction, AggregateNode } from '~/nodes/aggregates.ts'

const aggregateConstructor =
    (fn: AggregateFunction) => (...args: NodeArg[]) => (): Node => {
        const nodes: Node[] = args.map(toNode)
        if (nodes.length === 0) nodes.push(new RawNode(String(1)))

        return new AggregateNode(fn, nodes)
    }

/** SQL AVG(...) function */
const avg: NodeConstructor = aggregateConstructor(AggregateFunction.Avg)

/** SQL COUNT(...) function */
const count: NodeConstructor = aggregateConstructor(AggregateFunction.Count)

/** SQL MIN(...) function */
const min: NodeConstructor = aggregateConstructor(AggregateFunction.Min)

/** SQL MAX(...) function */
const max: NodeConstructor = aggregateConstructor(AggregateFunction.Max)

/** SQL SUM(...) function */
const sum: NodeConstructor = aggregateConstructor(AggregateFunction.Sum)

export { avg, count, max, min, sum }
