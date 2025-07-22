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

/** SQL "=" operator */
const eq: NodeConstructor = binaryConstructor(ComparisonOperator.Eq)

/** SQL "!=" operator */
const ne: NodeConstructor = binaryConstructor(ComparisonOperator.Ne)

/** SQL "<" operator */
const lt: NodeConstructor = binaryConstructor(ComparisonOperator.Lt)

/** SQL "<=" operator */
const le: NodeConstructor = binaryConstructor(ComparisonOperator.Le)

/** SQL ">" operator */
const gt: NodeConstructor = binaryConstructor(ComparisonOperator.Gt)

/** SQL ">=" operator */
const ge: NodeConstructor = binaryConstructor(ComparisonOperator.Ge)

/** SQL IN operator */
const in_: NodeConstructor = binaryConstructor(ComparisonOperator.In)

/** SQL LIKE operator */
const like: NodeConstructor = binaryConstructor(ComparisonOperator.Like)

export { eq, ge, gt, in_, le, like, lt, ne }
