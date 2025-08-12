import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    type ParameterReg,
    renderAll,
    toNode,
} from '~/core/node.ts'
import { id, raw } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Statements
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a SELECT statement with optional column specification.
 */
export class SelectNode implements Node {
    readonly priority: number = 0

    constructor(private readonly columns: ArrayLike<Node>) {}

    render(params: ParameterReg): SqlString {
        const _columns: SqlString = renderAll(this.columns, params).join(', ')

        return `${sql('SELECT')} ${_columns}`
    }
}

/**
 * Represents an INSERT statement for adding new rows.
 */
export class InsertNode implements Node {
    readonly priority: number = 0

    constructor(
        private readonly table: Node,
        private readonly columns: ArrayLike<Node>,
    ) {}

    render(params: ParameterReg): SqlString {
        const table: string = this.table.render(params)
        const cols: string = renderAll(this.columns, params).join(', ')

        return `${sql('INSERT')} ${sql('INTO')} ${table} (${cols})`
    }
}

/**
 * Represents an UPDATE statement for modifying existing rows.
 */
export class UpdateNode implements Node {
    readonly priority: number = 0

    constructor(private readonly table: Node) {}

    render(params: ParameterReg): SqlString {
        const table: string = this.table.render(params)

        return `${sql('UPDATE')} ${table}`
    }
}

/**
 * Represents a DELETE statement for removing rows.
 */
export class DeleteNode implements Node {
    readonly priority: number = 0

    render(_params: ParameterReg): SqlString {
        return sql('DELETE')
    }
}

// -> 🏭 Factories

/**
 * Creates a SELECT statement with optional column specification.
 * @param columns The optional columns to select
 * @returns A SELECT node
 */
export const _select = (columns?: NodeArg[]): Node =>
    new SelectNode(
        columns && columns.length > 0 ? columns.map(toNode) : raw('*'),
    )

/**
 * Creates an UPDATE statement for the specified table.
 * @param table The table to update
 * @returns An UPDATE node
 */
export const _update = (table: string): Node => new UpdateNode(id(table))

/**
 * Creates an INSERT statement with table and column specification.
 * @param table The table to insert into
 * @param columns The columns to insert
 * @returns An INSERT node
 */
export const _insert = (table: string, columns: NodeArg[]): Node =>
    new InsertNode(id(table), columns.map(toNode))

/**
 * Creates a DELETE statement.
 * @returns A DELETE node
 */
export const _delete = (): Node => new DeleteNode()
