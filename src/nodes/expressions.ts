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
 * Represents a unary operation with configurable operator positioning.
 * Used for operations with a single operand like NOT, DISTINCT, or ASC.
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
 * Represents a binary operation between two expressions.
 * Used for operations like comparisons, arithmetic, and logical operations.
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
 * Represents a logical conjunction with optional grouping.
 * Used for combining multiple conditions with AND or OR operators.
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

/**
 * Represents a CASE WHEN expression for conditional logic.
 * Provides SQL conditional statements with multiple branches.
 */
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
 * Creates a logical NOT expression to negate a condition.
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

/**
 * Creates an equality comparison between two expressions.
 * Use this to test if two values are the same.
 *
 * @example
 * ```ts
 * // user.name = 'John'
 * eq(user.name, 'John')
 * ```
 */
export const eq = binary('=')

/**
 * Creates a not-equal comparison between two expressions.
 * Use this to test if two values are different.
 *
 * @example
 * ```ts
 * // user.status != 'deleted'
 * ne(user.status, 'deleted')
 * ```
 */
export const ne = binary('!=')

/**
 * Creates a greater-than comparison between two expressions.
 * Use this to test if the left value is larger than the right value.
 *
 * @example
 * ```ts
 * // user.age > 18
 * gt(user.age, 18)
 * ```
 */
export const gt = binary('>')

/**
 * Creates a less-than comparison between two expressions.
 * Use this to test if the left value is smaller than the right value.
 *
 * @example
 * ```ts
 * // user.age < 18
 * lt(user.age, 18)
 * ```
 */
export const lt = binary('<')

/**
 * Creates a greater-than-or-equal comparison between two expressions.
 * Use this to test if the left value is larger than or equal to the right value.
 *
 * @example
 * ```ts
 * // user.score >= 100
 * ge(user.score, 100)
 * ```
 */
export const ge = binary('>=')

/**
 * Creates a less-than-or-equal comparison between two expressions.
 * Use this to test if the left value is smaller than or equal to the right value.
 *
 * @example
 * ```ts
 * // user.score <= 1000
 * le(user.score, 1000)
 * ```
 */
export const le = binary('<=')

// -> Pattern matching

/**
 * Creates a LIKE pattern matching comparison for text searching.
 * Use % for any characters and _ for single character wildcards.
 *
 * @example
 * ```ts
 * // user.name LIKE '%John%'
 * like(user.name, '%John%')
 * ```
 */
export const like = binary(sql('LIKE'))

/**
 * Creates a GLOB pattern matching comparison for Unix-style patterns.
 * Use * for any characters and ? for single character wildcards.
 *
 * @example
 * ```ts
 * // user.email GLOB '*@gmail.com'
 * glob(user.email, '*@gmail.com')
 * ```
 */
export const glob = binary(sql('GLOB'))

/**
 * Creates an IN comparison to check if a value exists in a list.
 * Use this to test membership in a set of values.
 *
 * @example
 * ```ts
 * // user.role IN ('admin', 'moderator')
 * in_(user.role, ['admin', 'moderator'])
 * ```
 */
export const in_ = binary(sql('IN'))

// -> Arithmetic operators

/**
 * Creates an addition operation between two numeric expressions.
 * Use this to add numbers or combine numeric columns.
 *
 * @example
 * ```ts
 * // user.score + 10
 * add(user.score, 10)
 * ```
 */
export const add = binary('+')

/**
 * Creates a subtraction operation between two numeric expressions.
 * Use this to subtract numbers or calculate differences.
 *
 * @example
 * ```ts
 * // user.balance - 100
 * sub(user.balance, 100)
 * ```
 */
export const sub = binary('-')

/**
 * Creates a multiplication operation between two numeric expressions.
 * Use this to multiply numbers or calculate products.
 *
 * @example
 * ```ts
 * // user.score * 2.5
 * mul(user.score, 2.5)
 * ```
 */
export const mul = binary('*')

/**
 * Creates a division operation between two numeric expressions.
 * Use this to divide numbers or calculate ratios.
 *
 * @example
 * ```ts
 * // user.score / 2,5
 * div(user.score, 2,5)
 * ```
 */
export const div = binary('/')

// -> Modifiers

/**
 * Creates a DISTINCT modifier to remove duplicate values.
 * Use this to ensure only unique values are returned.
 *
 * @example
 * ```ts
 * // DISTINCT user.city
 * distinct(user.city)
 * ```
 */
export const distinct = unary(sql('DISTINCT'), 'pfx')

/**
 * Creates an ALL quantifier (opposite of DISTINCT).
 * Use this to explicitly include all values including duplicates.
 *
 * @example
 * ```ts
 * // ALL user.name
 * all(user.name)
 * ```
 */
export const all = unary(sql('ALL'), 'pfx')

/**
 * Creates an ascending sort order for ORDER BY clauses.
 * Use this to sort results from smallest to largest.
 *
 * @example
 * ```ts
 * // user.name ASC
 * asc(user.name)
 * ```
 */
export const asc = unary(sql('ASC'))

/**
 * Creates a descending sort order for ORDER BY clauses.
 * Use this to sort results from largest to smallest.
 *
 * @example
 * ```ts
 * // user.createdAt DESC
 * desc(user.createdAt)
 * ```
 */
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
 * Creates a column or expression alias using AS.
 * Use this to give custom names to columns in your result set.
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
 * Creates a BETWEEN range comparison to check if a value falls within bounds.
 * Use this to test if a value is within a specific range (inclusive).
 *
 * @param test - The expression to test
 * @param lower - The lower bound (inclusive)
 * @param upper - The upper bound (inclusive)
 * @returns A SQL node that checks if the test value is within the range
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
 * Creates an EXISTS subquery check to test if a subquery returns any rows.
 * Use this to check for the existence of related records.
 *
 * @example
 * ```ts
 * // EXISTS (SELECT * FROM orders WHERE orders.userId = user.id)
 * exists(orders.select().where(order.userId.eq(user.id)))
 * ```
 */
export const exists = unary(sql('EXISTS'), 'pfx')

/**
 * Creates an IS NULL check to test if a value is null.
 * Use this to find records with missing or empty values.
 *
 * @example
 * ```ts
 * // user.deletedAt IS NULL
 * isNull(user.deletedAt)
 * ```
 */
export const isNull = unary(sql('IS NULL'), 'sfx')

/**
 * Creates an IS NOT NULL check to test if a value is not null.
 * Use this to find records with actual values (not missing or empty).
 *
 * @example
 * ```ts
 * // user.email IS NOT NULL
 * isNotNull(user.email)
 * ```
 */
export const isNotNull = unary(sql('IS NOT NULL'), 'sfx')

/**
 * Creates a CASE expression for conditional logic in SQL.
 * Use this to implement if-then-else logic in your queries.
 *
 * @param test - Optional expression to test against (for simple CASE)
 * @returns A CASE node with chainable when/then/else methods
 *
 * @example
 * ```ts
 * // Simple case with test expression
 * // CASE user.status WHEN 'active' THEN 'User is active' WHEN 'suspended' THEN 'User is suspended' ELSE 'Unknown status' END
 * case_(user.status)
 *   .when('active').then('User is active')
 *   .when('suspended').then('User is suspended')
 *   .else_('Unknown status')
 *
 * // Searched case with conditions
 * // CASE WHEN user.age < 18 THEN 'Minor' WHEN user.age < 65 THEN 'Adult' ELSE 'Senior' END
 * case_()
 *   .when(user.age.lt(18)).then('Minor')
 *   .when(user.age.lt(65)).then('Adult')
 *   .else_('Senior')
 * ```
 */
export const case_ = (test?: SqlNodeValue) =>
    new CaseNode(test ? expr(test) : undefined)
