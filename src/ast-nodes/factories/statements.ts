// deno-fmt-ignore-file
import { type Node, type NodeArg, toNode } from '~/core/node.ts'
import { DeleteNode, InsertNode, SelectNode, UpdateNode } from '~/ast-nodes/statements.ts'

const _select = (fields?: NodeArg[]) => (): Node =>
    new SelectNode(fields?.length ? fields.map(toNode) : undefined)

const _update = (table: NodeArg) => (): Node =>
    new UpdateNode(toNode(table))

const _insert = (table: NodeArg, fields: NodeArg[]) => (): Node =>
    new InsertNode(toNode(table), fields.map(toNode))

const _delete = () => (): Node =>
    new DeleteNode()

export { _delete, _insert, _select, _update }
