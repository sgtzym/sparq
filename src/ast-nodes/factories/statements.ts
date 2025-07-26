import { type Node, type NodeArg, toNode } from '~/core/node.ts'
import { DeleteNode, InsertNode, SelectNode, UpdateNode } from '~/ast-nodes/statements.ts'

const select = (...args: NodeArg[]) => (): Node => new SelectNode(args.map(toNode))
const update = (arg: NodeArg) => (): Node => new UpdateNode(toNode(arg))
const insert = (arg: NodeArg) => (): Node => new InsertNode(toNode(arg))
const delete_ = () => (): Node => new DeleteNode()

export { delete_ as delete, insert, select, update }
