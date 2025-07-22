import {
    type Node,
    type NodeArg,
    type NodeConstructor,
    toNode,
} from '~/core/node.ts'

import { AliasNode } from '~/nodes/alias.ts'

/** SQL AS keyword (alias) */
const alias: NodeConstructor = (...args: NodeArg[]) => (): Node => {
    const [name, asName] = args.map(toNode)
    return new AliasNode(name, asName)
}

export { alias }
