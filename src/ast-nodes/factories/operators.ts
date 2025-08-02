import { SQL_KEYWORDS as SQL } from '~/core/sql-constants.ts'
import { type Node, type NodeExpr, toNode } from '~/core/node.ts'
import {
    COMPARISON_OPERATORS,
    ComparisonNode,
    ConjunctionNode,
    LOGICAL_OPERATORS,
    ModifierNode,
    type Operator,
} from '~/ast-nodes/operators.ts'

/** 🏭 Node factories: Operators */

// Comparison operators (=, !=, ...)
const comparison = (op: Operator) => (left: NodeExpr, right: NodeExpr): Node =>
    new ComparisonNode(toNode(left), op, toNode(right))

export const eq = comparison(COMPARISON_OPERATORS.EQ)
export const ne = comparison(COMPARISON_OPERATORS.NE)
export const gt = comparison(COMPARISON_OPERATORS.GT)
export const lt = comparison(COMPARISON_OPERATORS.LT)
export const ge = comparison(COMPARISON_OPERATORS.GE)
export const le = comparison(COMPARISON_OPERATORS.LE)
export const like = comparison(LOGICAL_OPERATORS.LIKE)
export const in_ = comparison(LOGICAL_OPERATORS.IN)

export const between = (
    test: NodeExpr,
    lower: NodeExpr,
    upper: NodeExpr,
): Node =>
    new ComparisonNode(
        toNode(test),
        LOGICAL_OPERATORS.BETWEEN,
        new ConjunctionNode(LOGICAL_OPERATORS.AND, [
            toNode(lower),
            toNode(upper),
        ]),
    )

// Conjunction operators (AND, OR)
const conjunction =
    (op: Operator, grouped = false) => (...conditions: NodeExpr[]): Node =>
        new ConjunctionNode(op, conditions.map(toNode), grouped)

export const and = conjunction(LOGICAL_OPERATORS.AND, true)
export const or = conjunction(LOGICAL_OPERATORS.OR, true)

// Modifier operators (NOT, EXISTS, ...)
const modifier =
    (op: Operator, position: 'prefix' | 'suffix') =>
    (operand: NodeExpr): Node => new ModifierNode(op, toNode(operand), position)

export const not = modifier(LOGICAL_OPERATORS.NOT, 'prefix')
export const exists = modifier(LOGICAL_OPERATORS.EXISTS, 'prefix')
export const isNull = modifier(`${SQL.IS} ${SQL.NULL}`, 'suffix')
export const isNotNull = modifier(`${SQL.IS} ${SQL.NOT} ${SQL.NULL}`, 'suffix')
