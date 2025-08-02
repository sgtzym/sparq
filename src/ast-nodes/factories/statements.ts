import { type NodeExpr, type Node, toNode } from '~/core/node.ts'
import {
    DeleteNode,
    InsertNode,
    SelectNode,
    UpdateNode,
} from '~/ast-nodes/statements.ts'

/** 🏭 Node factories: Statements */

export const _select = (columns?: NodeExpr[]): Node =>
    new SelectNode(columns?.length ? columns.map(toNode) : undefined)

export const _update = (table: NodeExpr): Node => new UpdateNode(toNode(table))

export const _insert = (table: NodeExpr, columns: NodeExpr[]): Node =>
    new InsertNode(toNode(table), columns.map(toNode))

export const _delete = (): Node => new DeleteNode()
