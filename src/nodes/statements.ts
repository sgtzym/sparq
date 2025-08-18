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
 * Represents a SELECT statement with optional column specification.
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
 * Represents an INSERT statement for adding new rows.
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
 * Represents a DELETE statement for removing rows.
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
 * @param columns The optional columns to select
 * @returns A SELECT SqlNode
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
 * @param table The table to update
 * @returns An UPDATE SqlNode
 */
export const _update = (table: string): SqlNode => new UpdateNode(id(table))

/**
 * Creates an INSERT statement with table and column specification.
 * @param table The table to insert into
 * @param columns The columns to insert
 * @returns An INSERT SqlNode
 */
export const _insert = (table: string, columns: SqlNodeValue[]): SqlNode =>
    new InsertNode(id(table), columns.map(expr))

/**
 * Creates a DELETE statement.
 * @returns A DELETE SqlNode
 */
export const _delete = (): SqlNode => new DeleteNode()
