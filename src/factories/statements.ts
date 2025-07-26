import { type Node, type NodeArg, type NodeFactory, toNode } from '~/core/node.ts'
import { DeleteNode, InsertNode, SelectNode, UpdateNode } from '~/ast-nodes/statements.ts'

const select: NodeFactory = (...args: NodeArg[]) => (): Node => new SelectNode(args.map(toNode))
const update: NodeFactory = (arg: NodeArg) => (): Node => new UpdateNode(toNode(arg))
const insert: NodeFactory = (arg: NodeArg) => (): Node => new InsertNode(toNode(arg))
const delete_: NodeFactory = () => (): Node => new DeleteNode()

export { delete_ as delete, insert, select, update }
