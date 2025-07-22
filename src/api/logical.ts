import {
    type Node,
    type NodeArg,
    type NodeConstructor,
    toNode,
} from '~/core/node.ts'

import { LogicalNode, LogicalOperator } from '~/nodes/logical.ts'

const logicalConstructor =
    (operator: LogicalOperator) => (...args: NodeArg[]) => (): Node => {
        return new LogicalNode(operator, args.map(toNode))
    }

/** SQL AND operator */
const and: NodeConstructor = logicalConstructor(
    LogicalOperator.And,
)

/** SQL OR operator */
const or: NodeConstructor = logicalConstructor(
    LogicalOperator.Or,
)

/** SQL NOT operator */
const not: NodeConstructor = logicalConstructor(
    LogicalOperator.Not,
)

export { and, not, or }
