import { type Arg, type Node, toNode } from '~/core/node.ts'
import {
    DeleteNode,
    InsertNode,
    SelectNode,
    UpdateNode,
} from '~/ast-nodes/statements.ts'

/** 🏭 Node factories: Operators */

export const _select = (columns?: Arg[]): Node =>
    new SelectNode(columns?.length ? columns.map(toNode) : undefined)

export const _update = (table: Arg): Node => new UpdateNode(toNode(table))

export const _insert = (table: Arg, columns: Arg[]): Node =>
    new InsertNode(toNode(table), columns.map(toNode))

export const _delete = (): Node => new DeleteNode()
