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
     *
     * @param condition - The condition to test
     * @returns An object with a then() method to specify the result value
     *
     * @example
     * ```ts
     * case_().when(user.age.lt(18)).then('Minor')
     * // CASE WHEN user.age < 18 THEN 'Minor'
     * ```
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
     *
     * @param value - The default value when no conditions match
     * @returns The CaseNode for method chaining
     *
     * @example
     * ```ts
     * case_().when(user.age.lt(18)).then('Minor').else_('Adult')
     * // CASE WHEN user.age < 18 THEN 'Minor' ELSE 'Adult' END
     * ```
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
 * @param conditions - The conditions that must all be true
 * @returns A SQL node that combines the conditions with AND
 *
 * @example
 * ```ts
 * and(user.active.eq(true), user.age.gt(18))
 * // (user.active = true AND user.age > 18)
 * ```
 */
export const and = conjunction(sql('AND'), true)

/**
 * Combines multiple conditions with OR logic and wraps them in parentheses.
 * Use this when at least one condition must be true.
 *
 * @param conditions - The conditions where at least one must be true
 * @returns A SQL node that combines the conditions with OR
 *
 * @example
 * ```ts
 * or(user.role.eq('admin'), user.role.eq('moderator'))
 * // (user.role = 'admin' OR user.role = 'moderator')
 * ```
 */
export const or = conjunction(sql('OR'), true)

/**
 * Creates a logical NOT expression to negate a condition.
 * Use this to invert the logic of any boolean expression.
 *
 * @param value - The expression to negate
 * @returns A SQL node that negates the expression
 *
 * @example
 * ```ts
 * not(user.active.eq(true))
 * // NOT user.active = true
 *
 * not(exists(orders.select().where(orders.userId.eq(user.id))))
 * // NOT EXISTS (SELECT * FROM orders WHERE userId = user.id)
 * ```
 */
export const not = unary(sql('NOT'), 'pfx')

// -> Comparison operators

/**
 * Creates an equality comparison between two expressions.
 * Use this to test if two values are the same.
 *
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that compares the expressions for equality
 *
 * @example
 * ```ts
 * eq(user.name, 'John')
 * // user.name = 'John'
 *
 * eq(order.status, 'completed')
 * // order.status = 'completed'
 * ```
 */
export const eq = binary('=')

/**
 * Creates a not-equal comparison between two expressions.
 * Use this to test if two values are different.
 *
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that compares the expressions for inequality
 *
 * @example
 * ```ts
 * ne(user.status, 'deleted')
 * // user.status != 'deleted'
 *
 * ne(product.category, 'discontinued')
 * // product.category != 'discontinued'
 * ```
 */
export const ne = binary('!=')

/**
 * Creates a greater-than comparison between two expressions.
 * Use this to test if the left value is larger than the right value.
 *
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is greater than right
 *
 * @example
 * ```ts
 * gt(user.age, 18)
 * // user.age > 18
 *
 * gt(order.total, 100.00)
 * // order.total > 100.00
 * ```
 */
export const gt = binary('>')

/**
 * Creates a less-than comparison between two expressions.
 * Use this to test if the left value is smaller than the right value.
 *
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is less than right
 *
 * @example
 * ```ts
 * lt(user.age, 65)
 * // user.age < 65
 *
 * lt(product.stock, 10)
 * // product.stock < 10
 * ```
 */
export const lt = binary('<')

/**
 * Creates a greater-than-or-equal comparison between two expressions.
 * Use this to test if the left value is larger than or equal to the right value.
 *
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is greater than or equal to right
 *
 * @example
 * ```ts
 * ge(user.score, 100)
 * // user.score >= 100
 *
 * ge(employee.salary, 50000)
 * // employee.salary >= 50000
 * ```
 */
export const ge = binary('>=')

/**
 * Creates a less-than-or-equal comparison between two expressions.
 * Use this to test if the left value is smaller than or equal to the right value.
 *
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is less than or equal to right
 *
 * @example
 * ```ts
 * le(user.score, 1000)
 * // user.score <= 1000
 *
 * le(order.discount, 0.5)
 * // order.discount <= 0.5
 * ```
 */
export const le = binary('<=')

// -> Pattern matching

/**
 * Creates a LIKE pattern matching comparison for text searching.
 * Use % for any characters and _ for single character wildcards.
 *
 * @param left - The expression to search in
 * @param right - The pattern to search for
 * @returns A SQL node that performs pattern matching
 *
 * @example
 * ```ts
 * like(user.name, '%John%')
 * // user.name LIKE '%John%'
 *
 * like(product.code, 'ABC_123')
 * // product.code LIKE 'ABC_123'
 * ```
 */
export const like = binary(sql('LIKE'))

/**
 * Creates a GLOB pattern matching comparison for Unix-style patterns.
 * Use * for any characters and ? for single character wildcards.
 *
 * @param left - The expression to search in
 * @param right - The glob pattern to match
 * @returns A SQL node that performs glob matching
 *
 * @example
 * ```ts
 * glob(user.email, '*@gmail.com')
 * // user.email GLOB '*@gmail.com'
 *
 * glob(file.name, '*.pdf')
 * // file.name GLOB '*.pdf'
 * ```
 */
export const glob = binary(sql('GLOB'))

/**
 * Creates an IN comparison to check if a value exists in a list.
 * Use this to test membership in a set of values.
 *
 * @param left - The expression to test
 * @param right - The list of values to check against
 * @returns A SQL node that checks membership in a list
 *
 * @example
 * ```ts
 * in_(user.role, ['admin', 'moderator'])
 * // user.role IN ('admin', 'moderator')
 *
 * in_(product.status, ['active', 'featured'])
 * // product.status IN ('active', 'featured')
 * ```
 */
export const in_ = binary(sql('IN'))

// -> Arithmetic operators

/**
 * Creates an addition operation between two numeric expressions.
 * Use this to add numbers or combine numeric columns.
 *
 * @param left - The left operand
 * @param right - The right operand
 * @returns A SQL node that adds the operands
 *
 * @example
 * ```ts
 * add(user.score, 10)
 * // user.score + 10
 *
 * add(order.subtotal, order.tax)
 * // order.subtotal + order.tax
 * ```
 */
export const add = binary('+')

/**
 * Creates a subtraction operation between two numeric expressions.
 * Use this to subtract numbers or calculate differences.
 *
 * @param left - The left operand
 * @param right - The right operand
 * @returns A SQL node that subtracts the right operand from the left
 *
 * @example
 * ```ts
 * sub(user.balance, 100)
 * // user.balance - 100
 *
 * sub(product.retail_price, product.cost)
 * // product.retail_price - product.cost
 * ```
 */
export const sub = binary('-')

/**
 * Creates a multiplication operation between two numeric expressions.
 * Use this to multiply numbers or calculate products.
 *
 * @param left - The left operand
 * @param right - The right operand
 * @returns A SQL node that multiplies the operands
 *
 * @example
 * ```ts
 * mul(user.hours, 15.50)
 * // user.hours * 15.50
 *
 * mul(product.price, order.quantity)
 * // product.price * order.quantity
 * ```
 */
export const mul = binary('*')

/**
 * Creates a division operation between two numeric expressions.
 * Use this to divide numbers or calculate ratios.
 *
 * @param left - The dividend
 * @param right - The divisor
 * @returns A SQL node that divides the left operand by the right
 *
 * @example
 * ```ts
 * div(user.total, user.count)
 * // user.total / user.count
 *
 * div(sales.revenue, sales.orders)
 * // sales.revenue / sales.orders
 * ```
 */
export const div = binary('/')

// -> Modifiers

/**
 * Creates a DISTINCT modifier to remove duplicate values.
 * Use this to ensure only unique values are returned.
 *
 * @param value - The expression to apply DISTINCT to
 * @returns A SQL node with DISTINCT modifier
 *
 * @example
 * ```ts
 * distinct(user.city)
 * // DISTINCT user.city
 *
 * distinct(order.customer_id)
 * // DISTINCT order.customer_id
 * ```
 */
export const distinct = unary(sql('DISTINCT'), 'pfx')

/**
 * Creates an ALL quantifier (opposite of DISTINCT).
 * Use this to explicitly include all values including duplicates.
 *
 * @param value - The expression to apply ALL to
 * @returns A SQL node with ALL quantifier
 *
 * @example
 * ```ts
 * all(user.name)
 * // ALL user.name
 * ```
 */
export const all = unary(sql('ALL'), 'pfx')

/**
 * Creates an ascending sort order for ORDER BY clauses.
 * Use this to sort results from smallest to largest.
 *
 * @param value - The expression to sort by
 * @returns A SQL node that sorts in ascending order
 *
 * @example
 * ```ts
 * asc(user.name)
 * // user.name ASC
 *
 * asc(product.price)
 * // product.price ASC
 * ```
 */
export const asc = unary(sql('ASC'))

/**
 * Creates a descending sort order for ORDER BY clauses.
 * Use this to sort results from largest to smallest.
 *
 * @param value - The expression to sort by
 * @returns A SQL node that sorts in descending order
 *
 * @example
 * ```ts
 * desc(user.createdAt)
 * // user.createdAt DESC
 *
 * desc(order.total)
 * // order.total DESC
 * ```
 */
export const desc = unary(sql('DESC'))

/**
 * References a column from the EXCLUDED pseudo-table in ON CONFLICT clauses.
 * Use this in upsert operations to reference the conflicting row's values.
 *
 * @param value - The column or expression to reference from the excluded row
 * @returns A SQL node representing EXCLUDED.<column>
 *
 * @example
 * ```ts
 * excluded(user.name)
 * // EXCLUDED.user.name
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
 * @param value - The expression to alias
 * @param as - The alias name
 * @returns A SQL node with an alias
 *
 * @example
 * ```ts
 * alias(user.firstName, 'name')
 * // user.firstName AS name
 *
 * alias(count(order.id), 'total_orders')
 * // COUNT(order.id) AS total_orders
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
 * between(user.age, 18, 65)
 * // user.age BETWEEN 18 AND 65
 *
 * between(order.created_date, '2024-01-01', '2024-12-31')
 * // order.created_date BETWEEN '2024-01-01' AND '2024-12-31'
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
 * @param value - The subquery to test
 * @returns A SQL node that checks if the subquery has results
 *
 * @example
 * ```ts
 * exists(orders.select().where(orders.userId.eq(user.id)))
 * // EXISTS (SELECT * FROM orders WHERE orders.userId = user.id)
 *
 * // Find users who have placed orders
 * users.select().where(
 *   exists(orders.select().where(orders.userId.eq(user.id)))
 * )
 * ```
 */
export const exists = unary(sql('EXISTS'), 'pfx')

/**
 * Creates an IS NULL check to test if a value is null.
 * Use this to find records with missing or empty values.
 *
 * @param value - The expression to test
 * @returns A SQL node that checks for null values
 *
 * @example
 * ```ts
 * isNull(user.deletedAt)
 * // user.deletedAt IS NULL
 *
 * isNull(order.cancelledAt)
 * // order.cancelledAt IS NULL
 * ```
 */
export const isNull = unary(sql('IS NULL'), 'sfx')

/**
 * Creates an IS NOT NULL check to test if a value is not null.
 * Use this to find records with actual values (not missing or empty).
 *
 * @param value - The expression to test
 * @returns A SQL node that checks for non-null values
 *
 * @example
 * ```ts
 * isNotNull(user.email)
 * // user.email IS NOT NULL
 *
 * isNotNull(product.description)
 * // product.description IS NOT NULL
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
 * case_(user.status)
 *   .when('active').then('User is active')
 *   .when('suspended').then('User is suspended')
 *   .else_('Unknown status')
 * // CASE user.status WHEN 'active' THEN 'User is active' WHEN 'suspended' THEN 'User is suspended' ELSE 'Unknown status' END
 *
 * // Searched case with conditions
 * case_()
 *   .when(user.age.lt(18)).then('Minor')
 *   .when(user.age.lt(65)).then('Adult')
 *   .else_('Senior')
 * // CASE WHEN user.age < 18 THEN 'Minor' WHEN user.age < 65 THEN 'Adult' ELSE 'Senior' END
 * ```
 */
export const case_ = (test?: SqlNodeValue) =>
    new CaseNode(test ? expr(test) : undefined)
