import { type Node, type NodeArg, type NodeFactory, toNode } from '~/core/node.ts'
import {
    BinaryNode,
    COMPARISON_OPERATORS as COMPARISON,
    type ComparisonOperator,
    LOGICAL_OPERATORS as LOGICAL,
    LogicalNode,
    type LogicalOperator,
    UNARY_OPERATORS as UNARY,
    UnaryNode,
    type UnaryOperator,
} from '~/ast-nodes/operators.ts'

// Logical operators

const logicalFactory =
    (operator: LogicalOperator): NodeFactory => (...args: NodeArg[]) => (): Node => {
        return new LogicalNode(operator, args.map(toNode))
    }

const and = logicalFactory(LOGICAL.AND)
const or = logicalFactory(LOGICAL.OR)

export { and, or }

// Binary operators

const binaryFactory =
    (operator: ComparisonOperator): NodeFactory => (...args: NodeArg[]) => (): Node => {
        const [left, right] = args
        return new BinaryNode(
            toNode(left),
            operator,
            toNode(right),
        )
    }

const eq = binaryFactory(COMPARISON.EQ)
const ne = binaryFactory(COMPARISON.NE)
const lt = binaryFactory(COMPARISON.LT)
const le = binaryFactory(COMPARISON.LE)
const gt = binaryFactory(COMPARISON.GT)
const ge = binaryFactory(COMPARISON.GE)
const in_ = binaryFactory(COMPARISON.IN)
const like = binaryFactory(COMPARISON.LIKE)

export { eq, ge, gt, in_, le, like, lt, ne }

// Unary operators

const unaryFactory = (operator: UnaryOperator): NodeFactory => (arg: NodeArg) => (): Node => {
    return new UnaryNode(operator, toNode(arg))
}

const not = unaryFactory(UNARY.NOT)
const exists = unaryFactory(UNARY.EXISTS)
const isNull = unaryFactory(UNARY.IS_NULL)
const isNotNull = unaryFactory(UNARY.IS_NOT_NULL)

export { exists, isNotNull, isNull, not }
