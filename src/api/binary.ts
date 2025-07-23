import {
    type Node,
    type NodeArg,
    type NodeConstructor,
    toNode,
} from '~/core/node.ts'

import { BinaryNode, ComparisonOperator } from '~/nodes/binary.ts'

const binaryConstructor =
    (operator: ComparisonOperator) => (...args: NodeArg[]) => (): Node => {
        const [left, right] = args
        return new BinaryNode(
            operator,
            toNode(left),
            toNode(right),
        )
    }

/** SQL "=" binary expr */
const eq: NodeConstructor = binaryConstructor(ComparisonOperator.Eq)

/** SQL "!=" binary expr */
const ne: NodeConstructor = binaryConstructor(ComparisonOperator.Ne)

/** SQL "<" binary expr */
const lt: NodeConstructor = binaryConstructor(ComparisonOperator.Lt)

/** SQL "<=" binary expr */
const le: NodeConstructor = binaryConstructor(ComparisonOperator.Le)

/** SQL ">" binary expr */
const gt: NodeConstructor = binaryConstructor(ComparisonOperator.Gt)

/** SQL ">=" binary expr */
const ge: NodeConstructor = binaryConstructor(ComparisonOperator.Ge)

/** SQL IN binary expr */
const in_: NodeConstructor = binaryConstructor(ComparisonOperator.In)

/** SQL LIKE binary expr */
const like: NodeConstructor = binaryConstructor(ComparisonOperator.Like)

export { eq, ge, gt, in_, le, like, lt, ne }
