import { SQL_KEYWORDS as SQL } from '~/core/sql-constants.ts'
import { type Node, type NodeArg, NodeFactory, toNode } from '~/core/node.ts'
import {
    COMPARISON_OPERATORS,
    ComparisonNode,
    ConjunctionNode,
    LOGICAL_OPERATORS,
    ModifierNode,
    type Operator,
} from '~/ast-nodes/operators.ts'

/** SQL logical/comparison expr node factories 🏭 */

/**
 * Creates a conjunction factory for logical operators.
 * @param operator - Logical operator (AND, OR)
 * @returns Factory function for ConjunctionNode
 */
const conjunction: (operator: Operator, grouped: boolean) => NodeFactory =
    (operator: Operator, grouped: boolean): NodeFactory => (...conditions: NodeArg[]) =>
    (): Node => {
        return new ConjunctionNode(operator, conditions.map(toNode), grouped)
    }

/**
 * Creates a comparison factory for binary operators.
 * @param operator - Comparison operator (=, >, <, etc.)
 * @returns Factory function for ComparisonNode
 */
const comparison: (operator: Operator) => NodeFactory =
    (operator: Operator): NodeFactory => (left: NodeArg, right: NodeArg) => (): Node => {
        return new ComparisonNode(
            toNode(left),
            operator,
            toNode(right),
        )
    }

/**
 * Creates a modifier factory for prefix/suffix operators.
 * @param operator - Modifier operator (NOT, EXISTS, IS NULL, etc.)
 * @param position - Position of operator relative to operand
 * @returns Factory function for ModifierNode
 */
const modifier: (operator: Operator, position: 'prefix' | 'suffix') => NodeFactory =
    (operator: Operator, position: 'prefix' | 'suffix'): NodeFactory =>
    (operand: NodeArg) =>
    (): Node => {
        return new ModifierNode(operator, toNode(operand), position)
    }

/**
 * AND conjunction - combines multiple conditions with logical AND.
 * @param conditions - Conditions to combine
 * @example and(eq('status', 'active'), gt('age', 18))
 * @returns AND conjunction node factory
 */
const and: NodeFactory = conjunction(LOGICAL_OPERATORS.AND, true)

/**
 * OR conjunction - combines multiple conditions with logical OR.
 * @param conditions - Conditions to combine
 * @example or(eq('role', 'admin'), eq('role', 'moderator'))
 * @returns OR conjunction node factory
 */
const or: NodeFactory = conjunction(LOGICAL_OPERATORS.OR, true)

/**
 * Equality operator (=) - tests if two values are equal.
 * @param left - Left operand
 * @param right - Right operand
 * @example eq('status', 'active')
 * @returns Equality comparison node factory
 */
const eq: NodeFactory = comparison(COMPARISON_OPERATORS.EQ)

/**
 * Inequality operator (!=) - tests if two values are not equal.
 * @param left - Left operand
 * @param right - Right operand
 * @example ne('status', 'deleted')
 * @returns Inequality comparison node factory
 */
const ne: NodeFactory = comparison(COMPARISON_OPERATORS.NE)

/**
 * Less than operator (<) - tests if left value is less than right value.
 * @param left - Left operand
 * @param right - Right operand
 * @example lt('age', 21)
 * @returns Less than comparison node factory
 */
const lt: NodeFactory = comparison(COMPARISON_OPERATORS.LT)

/**
 * Greater than operator (>) - tests if left value is greater than right value.
 * @param left - Left operand
 * @param right - Right operand
 * @example gt('score', 80)
 * @returns Greater than comparison node factory
 */
const gt: NodeFactory = comparison(COMPARISON_OPERATORS.GT)

/**
 * Less than or equal operator (<=) - tests if left value is less than or equal to right value.
 * @param left - Left operand
 * @param right - Right operand
 * @example le('price', 100)
 * @returns Less than or equal comparison node factory
 */
const le: NodeFactory = comparison(COMPARISON_OPERATORS.LE)

/**
 * Greater than or equal operator (>=) - tests if left value is greater than or equal to right value.
 * @param left - Left operand
 * @param right - Right operand
 * @example ge('rating', 4.5)
 * @returns Greater than or equal comparison node factory
 */
const ge: NodeFactory = comparison(COMPARISON_OPERATORS.GE)

/**
 * IN operator - tests if value exists in a list of values.
 * @param expression - Expression to test
 * @param values - List of values to check against
 * @example in_('status', ['active', 'pending'])
 * @returns IN comparison node factory
 */
const in_: NodeFactory = comparison(LOGICAL_OPERATORS.IN)

/**
 * LIKE operator - tests if string matches a pattern with wildcards.
 * @param expression - String expression to test
 * @param pattern - Pattern with % (any chars) and _ (single char) wildcards
 * @example like('email', '%@example.com')
 * @returns LIKE comparison node factory
 */
const like: NodeFactory = comparison(LOGICAL_OPERATORS.LIKE)

/**
 * NOT operator - negates a boolean expression.
 * @param operand - Expression to negate
 * @example not(eq('active', true))
 * @returns NOT modifier node factory
 */
const not: NodeFactory = modifier(LOGICAL_OPERATORS.NOT, 'prefix')

/**
 * EXISTS operator - tests if a subquery returns any rows.
 * @param operand - Subquery to test
 * @example exists(subquery)
 * @returns EXISTS modifier node factory
 */
const exists: NodeFactory = modifier(LOGICAL_OPERATORS.EXISTS, 'prefix')

/**
 * IS NULL operator - tests if value is NULL.
 * @param operand - Expression to test for NULL
 * @example isNull('deleted_at')
 * @returns IS NULL modifier node factory
 */
const isNull: NodeFactory = modifier(`${SQL.IS} ${SQL.NULL}`, 'suffix')

/**
 * IS NOT NULL operator - tests if value is not NULL.
 * @param operand - Expression to test for non-NULL
 * @example isNotNull('email')
 * @returns IS NOT NULL modifier node factory
 */
const isNotNull: NodeFactory = modifier(`${SQL.IS} ${SQL.NOT} ${SQL.NULL}`, 'suffix')

/**
 * BETWEEN operator - tests if value falls within an inclusive range.
 * @param expression - Expression to test
 * @param lower - Lower bound of range (inclusive)
 * @param upper - Upper bound of range (inclusive)
 * @example between('age', 18, 65)
 * @returns BETWEEN comparison node factory
 */
const between: NodeFactory = (test: NodeArg, upper: NodeArg, lower: NodeArg) => (): Node => {
    return new ComparisonNode(
        toNode(test),
        LOGICAL_OPERATORS.BETWEEN,
        new ConjunctionNode(
            LOGICAL_OPERATORS.AND,
            [toNode(upper), toNode(lower)],
        ),
    )
}

export { and, between, eq, exists, ge, gt, in_, isNotNull, isNull, le, like, lt, ne, not, or }
