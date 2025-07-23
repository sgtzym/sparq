import { type NodeArg, type NodeConstructor, toNode } from '~/core/node.ts'
import { SetNode } from '~/nodes/set.ts'

const set: NodeConstructor = (...args: NodeArg[]) => (): SetNode => {
    return new SetNode(args.map(toNode))
}

export { set }
