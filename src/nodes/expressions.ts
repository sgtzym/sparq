import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Expressions
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a unary operation with configurable positioning (A x).
 */
export class UnaryNode extends SqlNode {
    constructor(
        private readonly operator: SqlNode,
        private readonly expr?: SqlNode,
        private readonly position: 'pfx' | 'sfx' = 'sfx',
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const op: string = this.operator.render(params)
        const expr: string | undefined = this.expr?.render(params)

        return this.expr
            ? this.position === 'pfx' ? `${op} ${expr}` : `${expr} ${op}`
            : op
    }
}

/**
 * Represents a binary operation (A x B).
 */
export class BinaryNode extends SqlNode {
    constructor(
        private readonly left: SqlNode,
        private readonly operator: SqlNode,
        private readonly right: SqlNode,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const left: string = this.left.render(params)
        const op: string = this.operator.render(params)
        const right: string = this.right.render(params)

        return `${left} ${op} ${right}`
    }
}

/**
 * Represents a conjunction operation (A and/or B).
 */
export class ConjunctionNode extends SqlNode {
    constructor(
        private readonly operator: SqlNode,
        private readonly conditions: ArrayLike<SqlNode>,
        private readonly grouped: boolean = false,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const op: string = this.operator.render(params)
        const conditions: string = renderSqlNodes(this.conditions, params).join(
            ` ${op} `,
        )

        return this.grouped ? `(${conditions})` : conditions
    }
}

// -> 🏭 Factories

/**
 * Creates a unary expression factory.
 * @param op - The unary operator
 * @param pos - The operator position (pre- or suffix)
 * @returns A function that creates unary nodes
 */
const unary =
    (op: string, pos: 'pfx' | 'sfx' = 'sfx') =>
    (value: SqlNodeValue): SqlNode => {
        return new UnaryNode(raw(op), expr(value), pos)
    }

/**
 * Creates a binary expression factory.
 * @param {string} op - The binary operator
 * @returns A function that creates binary nodes
 */
const binary =
    (op: string) => (left: SqlNodeValue, right: SqlNodeValue): SqlNode =>
        new BinaryNode(expr(left), raw(op), expr(right))

/**
 * Creates a conjunction operator factory with optional grouping.
 * @param op - The conjunction operator string
 * @param grouped - Whether to wrap in parentheses
 * @returns A function that creates conjunction nodes
 */
const conjunction =
    (op: string, grouped = false) => (...conditions: SqlNodeValue[]): SqlNode =>
        new ConjunctionNode(raw(op), conditions.map(expr), grouped)

// -> Logical operators

/**
 * Creates a logical AND operation with parentheses.
 * @param conditions - The conditions to combine
 * @returns A conjunction node
 */
export const and = conjunction(sql('AND'), true)

/**
 * Creates a logical OR operation with parentheses.
 * @param conditions - The conditions to combine
 * @returns A conjunction node
 */
export const or = conjunction(sql('OR'), true)

/**
 * Creates a NOT logical negation.
 * @param operand - The expression to negate
 * @returns A unary node
 */
export const not = unary(sql('NOT'), 'pfx')

// -> Comparison operators

/**
 * Creates an equality comparison (=).
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A comparison node
 */
export const eq = binary('=')

/**
 * Creates a not-equal comparison (!=).
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A comparison node
 */
export const ne = binary('!=')

/**
 * Creates a greater-than comparison (>).
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A comparison node
 */
export const gt = binary('>')

/**
 * Creates a less-than comparison (<).
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A comparison node
 */
export const lt = binary('<')

/**
 * Creates a greater-than-or-equal comparison (>=).
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A comparison node
 */
export const ge = binary('>=')

/**
 * Creates a less-than-or-equal comparison (<=).
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A comparison node
 */
export const le = binary('<=')

// -> Pattern matching

/**
 * Creates a LIKE pattern matching comparison.
 * @param left - The expression to match
 * @param right - The pattern to match against
 * @returns A comparison node
 */
export const like = binary(sql('LIKE'))

/**
 * Creates a GLOB pattern matching comparison.
 * @param left - The expression to match
 * @param right - The pattern to match against
 * @returns A comparison node
 */
export const glob = binary(sql('GLOB'))

/**
 * Creates an IN membership comparison.
 * @param left - The expression to test
 * @param right - The list of values to test against
 * @returns A comparison node
 */
export const in_ = binary(sql('IN'))

// -> Arithmetic operators

/**
 * Creates an addition operation (+).
 * @param left - The left operand
 * @param right - The right operand
 * @returns A binary node
 */
export const add = binary('+')

/**
 * Creates a subtraction operation (-).
 * @param left - The left operand
 * @param right - The right operand
 * @returns A binary node
 */
export const sub = binary('-')

/**
 * Creates a multiplication operation (*).
 * @param left - The left operand
 * @param right - The right operand
 * @returns A binary node
 */
export const mul = binary('*')

/**
 * Creates a division operation (/).
 * @param left - The left operand
 * @param right - The right operand
 * @returns A binary node
 */
export const div = binary('/')

// -> Modifiers

/**
 * Creates a DISTINCT modifier for removing duplicates.
 * @param expr - The optional expression to apply DISTINCT to
 * @returns A unary node
 */
export const distinct = unary(sql('DISTINCT'), 'pfx')

/**
 * Creates an ALL quantifier (opposite of DISTINCT).
 * @param expr - The optional expression to apply ALL to
 * @returns A unary node
 */
export const all = unary(sql('ALL'), 'pfx')

/**
 * Creates an ascending sort order (ASC).
 * @param expr - The expression to sort by
 * @returns A unary node
 */
export const asc = unary(sql('ASC'))

/**
 * Creates a descending sort order (DESC).
 * @param expr - The expression to sort by
 * @returns A unary node
 */
export const desc = unary(sql('DESC'))

// -> Special operations

/**
 * Creates a column or expression alias using AS.
 * @param expr - The expression to alias
 * @param as - The alias name
 * @returns A binary node
 */
export const alias = (value: SqlNodeValue, as: SqlNodeValue): SqlNode => {
    return new BinaryNode(expr(value), raw(sql('AS')), id(as))
}

/**
 * Creates a BETWEEN range comparison.
 * @param test - The expression to test
 * @param lower - The lower bound value
 * @param upper - The upper bound value
 * @returns A comparison node
 */
export const between = (
    test: SqlNodeValue,
    lower: SqlNodeValue,
    upper: SqlNodeValue,
): SqlNode =>
    new BinaryNode(
        expr(test),
        raw(sql('BETWEEN')),
        new ConjunctionNode(raw(sql('AND')), [
            expr(lower),
            expr(upper),
        ]),
    )

/**
 * Creates an EXISTS subquery check.
 * @param operand - The subquery to check
 * @returns A unary node
 */
export const exists = unary(sql('EXISTS'), 'pfx')

/**
 * Creates an IS NULL check.
 * @param operand - The expression to test
 * @returns A unary node
 */
export const isNull = unary(sql('IS NULL'), 'sfx')

/**
 * Creates an IS NOT NULL check.
 * @param operand - The expression to test
 * @returns A unary node
 */
export const isNotNull = unary(sql('IS NOT NULL'), 'sfx')
