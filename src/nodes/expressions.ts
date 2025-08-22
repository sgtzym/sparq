import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Expressions
// ---------------------------------------------

// -> 🔷 Nodes

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

export class CaseNode extends SqlNode {
    private conditions: Array<{ when: SqlNode; then: SqlNode }> = []
    private elseValue?: SqlNode

    constructor(private test?: SqlNode) {
        super()
    }

    /**
     * Adds a WHEN condition to the CASE expression.
     */
    when(condition: SqlNodeValue): { then: (value: SqlNodeValue) => CaseNode } {
        return {
            then: (value: SqlNodeValue) => {
                this.conditions.push({
                    when: this.test ? expr(condition) : expr(condition),
                    then: expr(value),
                })
                return this
            },
        }
    }

    /**
     * Adds an ELSE clause to the CASE expression.
     */
    else_(value: SqlNodeValue): this {
        this.elseValue = expr(value)
        return this
    }

    render(params: ParameterReg): SqlString {
        let sql = this.test ? `CASE ${this.test.render(params)}` : 'CASE'

        for (const { when, then } of this.conditions) {
            sql += ` WHEN ${when.render(params)} THEN ${then.render(params)}`
        }

        if (this.elseValue) {
            sql += ` ELSE ${this.elseValue.render(params)}`
        }

        return sql + ' END'
    }
}

// -> 🏭 Factories

const unary =
    (op: string, pos: 'pfx' | 'sfx' = 'sfx') =>
    (value: SqlNodeValue): SqlNode => {
        return new UnaryNode(raw(op), expr(value), pos)
    }

const binary =
    (op: string) => (left: SqlNodeValue, right: SqlNodeValue): SqlNode =>
        new BinaryNode(expr(left), raw(op), expr(right))

const conjunction =
    (op: string, grouped = false) => (...conditions: SqlNodeValue[]): SqlNode =>
        new ConjunctionNode(raw(op), conditions.map(expr), grouped)

// -> Logical operators

/**
 * Combines multiple conditions with AND logic and wraps them in parentheses.
 * Use this when all conditions must be true.
 *
 * @example
 * ```ts
 * // (user.active = true AND user.age > 18)
 * and(user.active.eq(true), user.age.gt(18))
 * ```
 */
export const and = conjunction(sql('AND'), true)

/**
 * Combines multiple conditions with OR logic and wraps them in parentheses.
 * Use this when at least one condition must be true.
 *
 * @example
 * ```ts
 * // (user.role = 'admin' OR user.role = 'moderator')
 * or(user.role.eq('admin'), user.role.eq('moderator'))
 * ```
 */
export const or = conjunction(sql('OR'), true)

/**
 * Negates conditions.
 * Use this to invert the logic of any boolean expression.
 *
 * @example
 * ```ts
 * // NOT user.active = true
 * not(user.active.eq(true))
 * ```
 */
export const not = unary(sql('NOT'), 'pfx')

// -> Comparison operators

/** Tests equality (=). */
export const eq = binary('=')

/** Tests inequality (!=). */
export const ne = binary('!=')

/** Tests if greater than (>). */
export const gt = binary('>')

/** Tests if less than (<). */
export const lt = binary('<')

/** Tests if greater than or equal (>=). */
export const ge = binary('>=')

/** Tests if less than or equal (<=). */
export const le = binary('<=')

// -> Pattern matching

/** Matches text pattern. */
export const like = binary(sql('LIKE'))

/** Matches Unix glob pattern. */
export const glob = binary(sql('GLOB'))

/** Tests membership in set. */
export const in_ = binary(sql('IN'))

// -> Arithmetic operators

/** Adds values (+). */
export const add = binary('+')

/** Subtracts values (-). */
export const sub = binary('-')

/** Multiplies values (*). */
export const mul = binary('*')

/** Divides values (/). */
export const div = binary('/')

// -> Modifiers

/** Removes duplicates. */
export const distinct = unary(sql('DISTINCT'), 'pfx')

/** Includes all values. */
export const all = unary(sql('ALL'), 'pfx')

/** Sorts ascending. */
export const asc = unary(sql('ASC'))

/** Sorts descending. */
export const desc = unary(sql('DESC'))

/**
 * References a column from the EXCLUDED pseudo-table in ON CONFLICT clauses.
 * Use this in upsert operations to reference the conflicting row's values.
 *
 * @example
 * ```ts
 * // EXCLUDED.user.name
 * excluded(user.name)
 *
 * // Common usage in upserts
 * users.insert('email', 'name')
 *   .values('john@example.com', 'John')
 *   .conflict('email').upsert([
 *     user.name.set(excluded(user.name))
 *   ])
 * ```
 */
export const excluded = unary(sql('EXCLUDED'), 'pfx')

// -> Special operations

/**
 * Creates an alias for columns or expressions.
 * Renames items in your result set.
 *
 * @example
 * ```ts
 * // user.firstName AS name
 * alias(user.firstName, 'name')
 *
 * // COUNT(order.id) AS total_orders
 * alias(count(order.id), 'total_orders')
 * ```
 */
export const alias = (value: SqlNodeValue, as: SqlNodeValue): SqlNode => {
    return new BinaryNode(expr(value), raw(sql('AS')), id(as))
}

/**
 * Tests if a value falls within a range.
 * Checks inclusively between lower and upper bounds.
 *
 * @param test - The expression to test
 * @param lower - The lower bound (inclusive)
 * @param upper - The upper bound (inclusive)
 *
 * @example
 * ```ts
 * // user.age BETWEEN 18 AND 99
 * between(user.age, 18, 99)
 * ```
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
 * Checks if a subquery returns any rows.
 * Tests for the existence of related records.
 *
 * @example
 * ```ts
 * // EXISTS (SELECT * FROM orders WHERE orders.userId = user.id)
 * exists(orders.select().where(order.userId.eq(user.id)))
 * ```
 */
export const exists = unary(sql('EXISTS'), 'pfx')

/**
 * Tests if a value is null.
 * Finds records with missing or empty values.
 *
 * @example
 * ```ts
 * // user.deletedAt IS NULL
 * isNull(user.deletedAt)
 * ```
 */
export const isNull = unary(sql('IS NULL'), 'sfx')

/**
 * Tests if a value is not null.
 * Finds records with actual values.
 *
 * @example
 * ```ts
 * // user.email IS NOT NULL
 * isNotNull(user.email)
 * ```
 */
export const isNotNull = unary(sql('IS NOT NULL'), 'sfx')

/**
 * Implements conditional logic in SQL queries.
 * Use this to create if-then-else logic.
 *
 * @param test - Optional expression to test against (for simple CASE)
 * @returns A CASE node with chainable when/then/else methods
 *
 * @example
 * ```ts
 * // Simple case with test expression
 * case_(user.status)
 *   .when('active').then('User is active')
 *   .when('suspended').then('User is suspended')
 *   .else_('Unknown status')
 *
 * // Searched case with conditions
 * case_()
 *   .when(user.age.lt(18)).then('Minor')
 *   .when(user.age.lt(65)).then('Adult')
 *   .else_('Senior')
 * ```
 */
export const case_ = (test?: SqlNodeValue) =>
    new CaseNode(test ? expr(test) : undefined)
