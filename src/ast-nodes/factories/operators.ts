// deno-fmt-ignore-file
import {
    type Node,
    type NodeArg,
    type NodeFactory,
    toNode
} from '~/core/node.ts'

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

/** SQL operator/comparison node factories 🏭 */

// Logical operators ->

/**
 * Creates a logical operator node factory.
 *
 * @param {LogicalOperator} operator - AND or OR operator
 * @returns {NodeFactory} Factory function for logical nodes
 */
const logicalFactory =
    (operator: LogicalOperator): NodeFactory => (...args: NodeArg[]) => (): Node => {
        return new LogicalNode(operator, args.map(toNode))
    }

/**
 * AND operator
 * 
 * Combines conditions with (A and B) logic.
 *
 * @example
 * and(eq('status', 'active'), gt('age', 18))
 */
const and = logicalFactory(LOGICAL.AND)

/**
 * OR operator
 * 
 * Combines conditions with (A or B) logic.
 *
 * @example
 * or(eq('role', 'admin'), eq('role', 'moderator'))
 */
const or = logicalFactory(LOGICAL.OR)

// Binary operators ->

/**
 * Creates a binary comparison operator node factory.
 *
 * @param {ComparisonOperator} operator - Comparison operator
 * @returns {NodeFactory} Factory function for binary nodes
 */
const binaryFactory =
    (operator: ComparisonOperator): NodeFactory => (...args: NodeArg[]) => (): Node => {
        const [left, right] = args
        return new BinaryNode(
            toNode(left),
            operator,
            toNode(right),
        )
    }

/**
 * Equality comparison (=)
 *
 * @example
 * eq('status', 'active')
 */
const eq = binaryFactory(COMPARISON.EQ)

/**
 * Inequality comparison (!=)
 *
 * @example
 * ne('status', 'deleted')
 */
const ne = binaryFactory(COMPARISON.NE)

/**
 * Less than comparison (<)
 *
 * @example
 * lt('age', 21)
 */
const lt = binaryFactory(COMPARISON.LT)

/**
 * Less than or equal comparison (<=)
 *
 * @example
 * le('price', 100)
 */
const le = binaryFactory(COMPARISON.LE)

/**
 * Greater than comparison (>)
 *
 * @example
 * gt('score', 80)
 */
const gt = binaryFactory(COMPARISON.GT)

/**
 * Greater than or equal comparison (>=)
 *
 * @example
 * ge('rating', 4.5)
 */
const ge = binaryFactory(COMPARISON.GE)

/**
 * IN comparison for value lists
 *
 * @example
 * in_('status', ['active', 'pending'])
 */
const in_ = binaryFactory(COMPARISON.IN)

/**
 * LIKE comparison for pattern matching
 *
 * @example
 * like('email', '%@example.com')
 */
const like = binaryFactory(COMPARISON.LIKE)

// Unary operators ->

/**
 * Creates a unary comparison operator node factory.
 *
 * @param {UnaryOperator} operator - Unary operator
 * @returns {NodeFactory} Factory function for unary nodes
 */
const unaryFactory = (operator: UnaryOperator): NodeFactory => (arg: NodeArg) => (): Node => {
    return new UnaryNode(operator, toNode(arg))
}

/**
 * NOT operator
 *
 * @example
 * not(eq('active', true))
 */
const not = unaryFactory(UNARY.NOT)

/**
 * EXISTS operator for Subquery checks
 *
 * @example
 * exists(subquery)
 */
const exists = unaryFactory(UNARY.EXISTS)

/**
 * IS NULL operator for null checks
 *
 * @example
 * isNull('deleted_at')
 */
const isNull = unaryFactory(UNARY.IS_NULL)

/**
 * IS NOT NULL operator for null checks
 *
 * @example
 * isNotNull('email')
 */
const isNotNull = unaryFactory(UNARY.IS_NOT_NULL)

export { 
    and,
    eq,
    exists,
    ge,
    gt,
    in_,
    isNotNull,
    isNull,
    le,
    like,
    lt,
    ne,
    not,
    or
}