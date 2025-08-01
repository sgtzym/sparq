// deno-fmt-ignore-file

import { type Node, type NodeArg, toNode } from '~/core/node.ts'
import {
    DeleteNode,
    InsertNode,
    SelectNode,
    UpdateNode
} from '~/ast-nodes/statements.ts'

/** SQL statement node factories 🏭 */

/**
 * SELECT statement
 * 
 * Requires from clause to complete.
 *
 * @private
 * @param {Array<NodeArg>} columns - Columns to select. If omitted, selects all columns.
 * @returns A factory function that creates a SelectNode
 * 
 * @example
 * _select()
 * _select('column_1', 'column_2')
 * _select(alias(count(), 'rows'))      // SELECT COUNT(*) AS rows
 */
const _select: (columns?: NodeArg[]) => () => Node =
    (columns?: NodeArg[]) => (): Node =>
        new SelectNode(columns?.length ? columns.map(toNode) : undefined)

/**
 * UPDATE statement
 * 
 * Requires set clause to complete.
 *
 * @private
 * @param {NodeArg} table - Table name to update
 * @returns A factory function that creates an UpdateNode
 * 
 * @example
 * _update('table_1')
 */
const _update: (table: NodeArg) => () => Node =
    (table: NodeArg) => (): Node =>
        new UpdateNode(toNode(table))

/**
 * INSERT INTO statement
 * 
 * Requires value clause to complete.
 *
 * @private
 * @param {NodeArg} table - Table name for insertion
 * @param {Array<NodeArg>} columns - Column names for the insert operation
 * @returns A factory function that creates an InsertNode
 * 
 * @example
 * _insert('table_1', ['column_1', 'column_2'])
 */
const _insert: (table: NodeArg, columns: NodeArg[]) => () => Node =
    (table: NodeArg, columns: NodeArg[]) => (): Node =>
        new InsertNode(toNode(table), columns.map(toNode))

/**
 * DELETE statement
 * 
 * Requires from clause to complete.
 *
 * @private
 * @returns A factory function that creates a DeleteNode
 * 
 * @example
 * _delete()
 */
const _delete: () => () => Node =
    () => (): Node =>
        new DeleteNode()

export { _delete, _insert, _select, _update }