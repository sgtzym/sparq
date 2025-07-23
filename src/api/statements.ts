import {
    type Node,
    type NodeArg,
    type NodeConstructor,
    toNode,
} from '~/core/node.ts'

import { RawNode } from '~/nodes/primitives.ts'
import { SelectNode, UpdateNode } from '../nodes/statements.ts'

/** SQL SELECT statement */
const select: NodeConstructor = (...args: NodeArg[]) => (): Node => {
    const nodes: Node[] = args.map(toNode)
    if (nodes.length === 0) nodes.push(new RawNode('*'))

    return new SelectNode(nodes)
}

/** SQL UPDATE statement */
const update: NodeConstructor = (...args: NodeArg[]) => (): Node => {
    const nodes: Node[] = args.map(toNode)

    return new UpdateNode(nodes)
}

export { select, update }
