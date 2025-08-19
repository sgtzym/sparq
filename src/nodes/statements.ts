import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import {
    isSqlNode,
    renderSqlNodes,
    SqlNode,
    type SqlNodeValue,
} from '~/core/sql-node.ts'
import { expr, id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Statements
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a SELECT statement for querying data from tables.
 * The foundation for all data retrieval operations.
 */
export class SelectNode extends SqlNode {
    override _priority: number = 0

    constructor(private readonly columns: ArrayLike<SqlNode>) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const _columns: SqlString = renderSqlNodes(this.columns, params).join(
            ', ',
        )

        return `${sql('SELECT')} ${_columns}`
    }
}

/**
 * Represents an INSERT statement for adding new rows to tables.
 * Used to create new records in your database.
 */
export class InsertNode extends SqlNode {
    override _priority: number = 0

    constructor(
        private readonly table: SqlNode,
        private readonly columns: ArrayLike<SqlNode>,
    ) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const table: string = this.table.render(params)
        const cols: string = renderSqlNodes(this.columns, params).join(', ')

        return `${sql('INSERT')} ${sql('INTO')} ${table} (${cols})`
    }
}

/**
 * Represents an UPDATE statement for modifying existing rows.
 * Used to change data in records that already exist.
 */
export class UpdateNode extends SqlNode {
    override _priority: number = 0

    constructor(private readonly table: SqlNode) {
        super()
    }

    render(params: ParameterReg): SqlString {
        const table: string = this.table.render(params)

        return `${sql('UPDATE')} ${table}`
    }
}

/**
 * Represents a DELETE statement for removing rows from tables.
 * Used to permanently remove records from your database.
 */
export class DeleteNode extends SqlNode {
    override _priority: number = 0

    constructor() {
        super()
    }

    render(_params: ParameterReg): SqlString {
        return sql('DELETE')
    }
}

// -> 🏭 Factories

/**
 * Creates a SELECT statement with optional column specification.
 * Use this to retrieve data from tables with specific columns or all columns.
 *
 * @param columns - The columns to select (defaults to * if empty)
 * @returns A SELECT statement node
 *
 * @example
 * ```ts
 * _select(['name', 'email'])      // SELECT name, email
 * _select([user.name, user.age])  // SELECT users.name, users.age
 * _select()                       // SELECT *
 *
 * // With expressions and aliases
 * _select([
 *   user.name,
 *   upper(user.email).as('email_upper'),
 *   count().as('total')
 * ])
 * ```
 */
export const _select = (columns?: SqlNodeValue[]): SqlNode => {
    if (!columns || columns.length === 0) {
        return new SelectNode(raw('*'))
    }

    const _columns: SqlNode[] = columns.map((col) =>
        isSqlNode(col) ? col : id(col)
    )

    return new SelectNode(_columns)
}

/**
 * Creates an UPDATE statement for the specified table.
 * Use this as the starting point for modifying existing records.
 *
 * @param table - The table to update
 * @returns An UPDATE statement node
 *
 * @example
 * ```ts
 * _update('users')        // UPDATE users
 * _update('products')     // UPDATE products
 *
 * // Typically followed by SET, WHERE clauses
 * // UPDATE users SET name = 'John' WHERE id = 1
 * ```
 */
export const _update = (table: string): SqlNode => new UpdateNode(id(table))

/**
 * Creates an INSERT statement with table and column specification.
 * Use this to add new records to a table with specified columns.
 *
 * @param table - The table to insert into
 * @param columns - The columns to insert values into
 * @returns An INSERT statement node
 *
 * @example
 * ```ts
 * _insert('users', ['name', 'email'])
 * // INSERT INTO users (name, email)
 *
 * _insert('orders', [order.userId, order.total, order.status])
 * // INSERT INTO orders (orders.userId, orders.total, orders.status)
 *
 * // Typically followed by VALUES clause
 * // INSERT INTO users (name, email) VALUES ('John', 'john@example.com')
 * ```
 */
export const _insert = (table: string, columns: SqlNodeValue[]): SqlNode =>
    new InsertNode(id(table), columns.map(expr))

/**
 * Creates a DELETE statement.
 * Use this as the starting point for removing records from tables.
 *
 * @returns A DELETE statement node
 *
 * @example
 * ```ts
 * _delete()               // DELETE
 *
 * // Typically followed by FROM and WHERE clauses
 * // DELETE FROM users WHERE active = false
 * ```
 */
export const _delete = (): SqlNode => new DeleteNode()