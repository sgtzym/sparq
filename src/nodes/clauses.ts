import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { renderSqlNodes, SqlNode, type SqlNodeValue } from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Clauses
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a FROM clause that specifies which tables to query.
 * Essential for SELECT, UPDATE, and DELETE operations.
 */
export class FromNode extends SqlNode {
    override readonly _priority: number = 1

    constructor(private readonly tables: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _tables: SqlString = renderSqlNodes(this.tables, params).join(
            ', ',
        )

        return sql('FROM', _tables)
    }
}

/**
 * Represents a JOIN clause for combining data from multiple tables.
 * Enables relational queries across related tables.
 */
export class JoinNode extends SqlNode {
    override readonly _priority: number = 2

    constructor(
        private readonly joinType: SqlNode,
        private readonly table: SqlNode,
        private readonly condition?: SqlNode,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _type: SqlString = this.joinType.render(params)
        const _table: SqlString = this.table.render(params)
        const _condition: SqlString | undefined = this.condition?.render(params)

        return _condition
            ? sql(_type, 'JOIN', _table, 'ON', _condition)
            : sql(_type, 'JOIN', _table)
    }
}

/**
 * Represents a SET clause for UPDATE operations.
 * Specifies which columns to update and their new values.
 */
export class SetNode extends SqlNode {
    override readonly _priority: number = 2

    constructor(private readonly assignments: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _assignments: SqlString = renderSqlNodes(this.assignments, params)
            .join(', ')

        return sql('SET', _assignments)
    }
}

/**
 * Represents a WHERE clause for filtering rows.
 * The primary mechanism for specifying query conditions.
 */
export class WhereNode extends SqlNode {
    override readonly _priority: number = 3

    constructor(private readonly conditions: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _conditions: SqlString = renderSqlNodes(this.conditions, params)
            .join(
                ` ${sql('AND')} `,
            )

        return sql('WHERE', _conditions)
    }
}

/**
 * Represents a GROUP BY clause for aggregating results.
 * Groups rows together for aggregate function calculations.
 */
export class GroupByNode extends SqlNode {
    override readonly _priority: number = 4

    constructor(private readonly expr: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderSqlNodes(this.expr, params).join(', ')

        return sql('GROUP BY', _expr)
    }
}

/**
 * Represents a HAVING clause for filtering grouped results.
 * Like WHERE, but operates on grouped data after aggregation.
 */
export class HavingNode extends SqlNode {
    override readonly _priority: number = 5

    constructor(private readonly conditions: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _conditions: SqlString = renderSqlNodes(this.conditions, params)
            .join(
                ` ${sql('AND')} `,
            )

        return sql('HAVING', _conditions)
    }
}

/**
 * Represents an ORDER BY clause for sorting results.
 * Controls the order in which rows are returned.
 */
export class OrderByNode extends SqlNode {
    override readonly _priority: number = 6

    constructor(private readonly expr: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _expr: SqlString = renderSqlNodes(this.expr, params).join(', ')

        return sql('ORDER BY', _expr)
    }
}

/**
 * Represents a LIMIT clause for restricting result count.
 * Controls the maximum number of rows returned.
 */
export class LimitNode extends SqlNode {
    override readonly _priority: number = 7

    constructor(private readonly count: SqlNode) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('LIMIT', _count)
    }
}

/**
 * Represents an OFFSET clause for skipping rows in pagination.
 * Used with LIMIT to implement pagination.
 */
export class OffsetNode extends SqlNode {
    override readonly _priority: number = 8

    constructor(private readonly count: SqlNode) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _count: SqlString = this.count.render(params)

        return sql('OFFSET', _count)
    }
}

/**
 * Represents a VALUES clause for specifying explicit row data.
 * Contains the actual data to be inserted into tables.
 */
export class ValuesNode extends SqlNode {
    override readonly _priority = 9

    private rows: SqlNode[] = []

    constructor() {
        super()
    }

    /**
     * Adds a row of values to the VALUES clause.
     * Call this multiple times to insert multiple rows at once.
     *
     * @param valueList - A value list node containing the row data
     *
     * @example
     * ```ts
     * const valuesNode = new ValuesNode()
     * valuesNode.addRow(valueList('John', 25))
     * valuesNode.addRow(valueList('Jane', 30))
     * // VALUES ('John', 25), ('Jane', 30)
     * ```
     */
    addRow(valueList: SqlNode): void {
        this.rows.push(valueList)
    }

    render(params: ParameterReg): SqlString {
        const _rows: SqlString = renderSqlNodes(this.rows, params).join(', ')

        return sql('VALUES', _rows)
    }
}

/**
 * Represents a RETURNING clause for getting data from modified rows.
 * Returns specified columns from rows affected by INSERT, UPDATE, or DELETE.
 */
export class ReturningNode extends SqlNode {
    override readonly _priority = 10

    constructor(private readonly columns?: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _columns: SqlString = this.columns
            ? renderSqlNodes(this.columns, params).join(', ')
            : '*'
        return `${sql('RETURNING', _columns)};`
    }
}

/**
 * Represents an ON CONFLICT clause for handling constraint violations.
 * Specifies what to do when INSERT operations encounter conflicts.
 */
export class OnConflictNode extends SqlNode {
    override _priority: number = 11

    constructor(
        private readonly action: SqlNode,
        private readonly targets?: ArrayLike<SqlNode>,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _action: SqlString = this.action.render(params)

        const _targets: SqlString | undefined = this.targets
            ? renderSqlNodes(this.targets, params).join(', ')
            : undefined

        return sql(
            'ON CONFLICT',
            _targets ? `(${_targets})` : '',
            'DO',
            _action,
        )
    }
}

/**
 * Represents an UPSERT clause for INSERT with UPDATE on conflict.
 * Combines INSERT and UPDATE operations for conflict resolution.
 */
export class UpsertNode extends SqlNode {
    override _priority: number = 11

    constructor(
        private readonly assignments: ArrayLike<SqlNode>,
        private readonly targets?: ArrayLike<SqlNode>,
        private readonly conditions?: ArrayLike<SqlNode>,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _assignments: SqlString = renderSqlNodes(this.assignments, params)
            .join(', ')

        const _targets: SqlString | undefined = this.targets
            ? renderSqlNodes(this.targets, params).join(', ')
            : undefined

        const _conditions: SqlString | undefined = this.conditions
            ? renderSqlNodes(this.conditions, params).join(` ${sql('AND')} `)
            : undefined

        return sql(
            'ON CONFLICT',
            _targets ? `(${_targets})` : '',
            'DO UPDATE SET',
            _assignments,
            _conditions ? `WHERE ${_conditions}` : '',
        )
    }
}

// -> 🏭 Factories

/**
 * Creates a FROM clause specifying which tables to query.
 * Use this to indicate the source tables for your data.
 *
 * @param tables - The table names to select from
 * @returns A FROM clause node
 *
 * @example
 * ```ts
 * from('users')                    // FROM users
 * from('users', 'profiles')        // FROM users, profiles
 * from(users.table, orders.table)  // FROM users, orders
 * ```
 */
export const from = (...tables: SqlNodeValue[]) => new FromNode(tables.map(id))

/**
 * Creates a JOIN clause factory.
 * @param type - The join type string
 * @returns A function that creates join nodes
 */

const join =
    (type: string) =>
    (table: SqlNodeValue, condition?: SqlNodeValue): SqlNode =>
        new JoinNode(
            raw(type),
            id(table),
            condition ? expr(condition) : undefined,
        )

/**
 * Creates an INNER JOIN clause to combine tables on matching rows.
 * Use this to get only rows that have matches in both tables.
 *
 * @param table - The table to join
 * @param condition - The join condition (optional)
 * @returns An INNER JOIN clause node
 *
 * @example
 * ```ts
 * joinInner('profiles', user.id.eq(profile.userId))
 * // INNER JOIN profiles ON user.id = profile.userId
 *
 * joinInner('orders')  // INNER JOIN orders (condition added later)
 * ```
 */
export const joinInner = join(sql('INNER'))

/**
 * Creates a LEFT JOIN clause to include all rows from the left table.
 * Use this to get all rows from the first table, with matching rows from the second.
 *
 * @param table - The table to join
 * @param condition - The join condition (optional)
 * @returns A LEFT JOIN clause node
 *
 * @example
 * ```ts
 * joinLeft('orders', user.id.eq(order.userId))
 * // LEFT JOIN orders ON user.id = order.userId
 *
 * // Get all users, including those without orders
 * users.select().join(orders).left(user.id.eq(order.userId))
 * ```
 */
export const joinLeft = join(sql('LEFT'))

/**
 * Creates a LEFT OUTER JOIN clause (same as LEFT JOIN).
 * Alternative syntax for LEFT JOIN operations.
 *
 * @param table - The table to join
 * @param condition - The join condition (optional)
 * @returns A LEFT OUTER JOIN clause node
 *
 * @example
 * ```ts
 * joinLeftOuter('comments', post.id.eq(comment.postId))
 * // LEFT OUTER JOIN comments ON post.id = comment.postId
 * ```
 */
export const joinLeftOuter = join(sql('LEFT OUTER'))

/**
 * Creates a CROSS JOIN clause for Cartesian product of tables.
 * Use this to get all possible combinations of rows from both tables.
 *
 * @param table - The table to cross join
 * @returns A CROSS JOIN clause node
 *
 * @example
 * ```ts
 * joinCross('categories')
 * // CROSS JOIN categories
 *
 * // Get all combinations of users and roles
 * users.select().join(roles).cross()
 * ```
 */
export const joinCross = (table: SqlNodeValue) =>
    new JoinNode(raw(sql('CROSS')), id(table))

/**
 * Creates a WHERE clause for filtering rows based on conditions.
 * Use this to specify which rows should be included in your results.
 *
 * @param conditions - The conditions that must be true
 * @returns A WHERE clause node
 *
 * @example
 * ```ts
 * where(user.active.eq(true), user.age.gt(18))
 * // WHERE user.active = true AND user.age > 18
 *
 * where(or(user.role.eq('admin'), user.role.eq('moderator')))
 * // WHERE (user.role = 'admin' OR user.role = 'moderator')
 * ```
 */
export const where = (...conditions: SqlNodeValue[]) =>
    new WhereNode(conditions.map(expr))

/**
 * Creates a GROUP BY clause for aggregating results by columns.
 * Use this to group rows together for aggregate calculations.
 *
 * @param columns - The columns to group by
 * @returns A GROUP BY clause node
 *
 * @example
 * ```ts
 * groupBy(user.department, user.role)
 * // GROUP BY user.department, user.role
 *
 * // Count users by department
 * users.select(user.department, count())
 *   .groupBy(user.department)
 * ```
 */
export const groupBy = (...columns: SqlNodeValue[]) =>
    new GroupByNode(columns.map(id))

/**
 * Creates a HAVING clause for filtering grouped results.
 * Use this to filter groups after aggregation (like WHERE for groups).
 *
 * @param conditions - The conditions to filter grouped results
 * @returns A HAVING clause node
 *
 * @example
 * ```ts
 * having(count(user.id).gt(5))
 * // HAVING COUNT(user.id) > 5
 *
 * // Find departments with more than 10 employees
 * users.select(user.department, count())
 *   .groupBy(user.department)
 *   .having(count().gt(10))
 * ```
 */
export const having = (...conditions: SqlNodeValue[]) =>
    new HavingNode(conditions.map(expr))

/**
 * Creates an ORDER BY clause for sorting query results.
 * Use this to control the order in which rows are returned.
 *
 * @param columns - The columns to sort by
 * @returns An ORDER BY clause node
 *
 * @example
 * ```ts
 * orderBy(user.name.asc(), user.createdAt.desc())
 * // ORDER BY user.name ASC, user.createdAt DESC
 *
 * orderBy(user.lastName, user.firstName)
 * // ORDER BY user.lastName, user.firstName (default ASC)
 * ```
 */
export const orderBy = (...columns: SqlNodeValue[]) =>
    new OrderByNode(columns.map(id))

/**
 * Creates a LIMIT clause for restricting the number of results.
 * Use this to control how many rows are returned.
 *
 * @param count - The maximum number of rows to return
 * @returns A LIMIT clause node
 *
 * @example
 * ```ts
 * limit(10)               // LIMIT 10
 * limit(user.pageSize)    // LIMIT user.pageSize
 *
 * // Get top 5 highest-scoring users
 * users.select().orderBy(user.score.desc()).limit(5)
 * ```
 */
export const limit = (count: SqlNodeValue) => new LimitNode(expr(count))

/**
 * Creates an OFFSET clause for skipping rows in pagination.
 * Use this with LIMIT to implement pagination functionality.
 *
 * @param count - The number of rows to skip
 * @returns An OFFSET clause node
 *
 * @example
 * ```ts
 * offset(20)              // OFFSET 20
 * offset(mul(page, 10))   // OFFSET page * 10
 *
 * // Get page 3 of results (20 per page)
 * users.select().limit(20).offset(40)
 * ```
 */
export const offset = (count: SqlNodeValue) => new OffsetNode(expr(count))

/**
 * Creates a RETURNING clause to get data from affected rows.
 * Use this to retrieve information about rows that were inserted, updated, or deleted.
 *
 * @param columns - The columns to return (defaults to * if empty)
 * @returns A RETURNING clause node
 *
 * @example
 * ```ts
 * returning(user.id, user.name)       // RETURNING user.id, user.name
 * returning()                         // RETURNING *
 *
 * // Get the ID of newly inserted user
 * users.insert('name', 'email')
 *   .values('John', 'john@example.com')
 *   .returning(user.id)
 * ```
 */
export const returning = (...columns: SqlNodeValue[]) =>
    new ReturningNode(
        columns && columns.length > 0 ? columns.map(id) : raw('*'),
    )

/**
 * Creates a VALUES clause for specifying explicit row data.
 * Use this to define the actual data for INSERT operations.
 *
 * @returns A VALUES clause node
 *
 * @example
 * ```ts
 * const valuesClause = values()
 * valuesClause.addRow(valueList('John', 25))
 * valuesClause.addRow(valueList('Jane', 30))
 * // VALUES ('John', 25), ('Jane', 30)
 * ```
 */
export const values = () => new ValuesNode()

/**
 * Creates a SET clause for UPDATE operations.
 * Use this to specify which columns should be updated and their new values.
 *
 * @param assignments - The column assignments
 * @returns A SET clause node
 *
 * @example
 * ```ts
 * set(user.name.set('John'), user.age.set(25))
 * // SET user.name = 'John', user.age = 25
 *
 * set(product.price.set(mul(product.price, 1.1)))
 * // SET product.price = product.price * 1.1
 * ```
 */
export const set = (...assignments: SqlNodeValue[]) =>
    new SetNode(assignments.map(expr))

/**
 * Creates a ON CONFLICT clause factory.
 * @param action - The action to resolve the conflict
 * @param target - The conflict target (columns)
 * @returns A function that creates join nodes
 */
const conflict = (action: string) => (...targets: SqlNodeValue[]) =>
    new OnConflictNode(raw(action), targets.map(id))

/**
 * Creates an ON CONFLICT DO ABORT clause.
 * Use this to abort the transaction when a conflict occurs.
 *
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 *
 * @example
 * ```ts
 * onConflictAbort('email')
 * // ON CONFLICT (email) DO ABORT
 * ```
 */
export const onConflictAbort = conflict(sql('ABORT'))

/**
 * Creates an ON CONFLICT DO FAIL clause.
 * Use this to fail the current statement when a conflict occurs.
 *
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 *
 * @example
 * ```ts
 * onConflictFail('username')
 * // ON CONFLICT (username) DO FAIL
 * ```
 */
export const onConflictFail = conflict(sql('FAIL'))

/**
 * Creates an ON CONFLICT DO IGNORE clause.
 * Use this to silently ignore conflicts and continue.
 *
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 *
 * @example
 * ```ts
 * onConflictIgnore('email')
 * // ON CONFLICT (email) DO IGNORE
 *
 * // Insert user, ignore if email already exists
 * users.insert('name', 'email')
 *   .values('John', 'john@example.com')
 *   .conflict('email').ignore()
 * ```
 */
export const onConflictIgnore = conflict(sql('IGNORE'))

/**
 * Creates an ON CONFLICT DO REPLACE clause.
 * Use this to replace the entire row when a conflict occurs.
 *
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 *
 * @example
 * ```ts
 * onConflictReplace('id')
 * // ON CONFLICT (id) DO REPLACE
 * ```
 */
export const onConflictReplace = conflict(sql('REPLACE'))

/**
 * Creates an ON CONFLICT DO ROLLBACK clause.
 * Use this to rollback the transaction when a conflict occurs.
 *
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 *
 * @example
 * ```ts
 * onConflictRollback('unique_key')
 * // ON CONFLICT (unique_key) DO ROLLBACK
 * ```
 */
export const onConflictRollback = conflict(sql('ROLLBACK'))

/**
 * Creates an ON CONFLICT DO NOTHING clause.
 * Use this to skip the conflicting row and continue with other operations.
 *
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 *
 * @example
 * ```ts
 * onConflictNothing('email')
 * // ON CONFLICT (email) DO NOTHING
 *
 * // Insert multiple users, skip duplicates
 * users.insert('name', 'email')
 *   .values('John', 'john@example.com')
 *   .values('Jane', 'jane@example.com')
 *   .conflict('email').nothing()
 * ```
 */
export const onConflictNothing = conflict(sql('NOTHING'))

/**
 * Creates an ON CONFLICT DO UPDATE clause for upsert operations.
 * Use this to update existing rows when conflicts occur during insert.
 *
 * @param assignments - The column assignments for the update
 * @param targets - The conflict target columns (optional)
 * @param conditions - Additional WHERE conditions for the update (optional)
 * @returns An UPSERT clause node
 *
 * @example
 * ```ts
 * onConflictUpdate([user.name.set('John Updated')], ['email'])
 * // ON CONFLICT (email) DO UPDATE SET user.name = 'John Updated'
 *
 * // Upsert with conditions
 * onConflictUpdate(
 *   [user.loginCount.set(add(user.loginCount, 1))],
 *   ['email'],
 *   [user.active.eq(true)]
 * )
 * // ON CONFLICT (email) DO UPDATE SET user.loginCount = user.loginCount + 1 WHERE user.active = true
 *
 * // Common upsert pattern
 * users.insert('email', 'name', 'loginCount')
 *   .values('john@example.com', 'John', 1)
 *   .conflict('email').upsert([
 *     user.name.set(excluded(user.name)),
 *     user.loginCount.set(add(user.loginCount, 1))
 *   ])
 * ```
 */
export const onConflictUpdate = (
    assignments: SqlNodeValue[],
    targets?: SqlNodeValue[],
    conditions?: SqlNodeValue[],
) => {
    const _targets: SqlNode[] | undefined = targets?.map(id) ?? undefined
    const _conditions: SqlNode[] | undefined = conditions?.map(expr) ??
        undefined

    return new UpsertNode(
        assignments.map(expr),
        _targets,
        _conditions,
    )
}
