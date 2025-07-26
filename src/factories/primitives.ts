import { sql } from '~/core/sql.ts'
import type { Node, NodeArg, NodeFactory } from '~/core/node.ts'
import { IdentifierNode, LiteralNode, RawNode } from '~/ast-nodes/primitives.ts'

const raw: NodeFactory = (sql: NodeArg) => (): Node => {
    if (typeof sql !== 'string') {
        throw new Error()
    }
    return new RawNode(sql as string)
}

const id: NodeFactory = (name: NodeArg) => (): Node => {
    if (!sql.isIdentifier(name)) {
        throw new Error()
    }
    return new IdentifierNode(name)
}

const val: NodeFactory = (arg: NodeArg) => (): Node => {
    if (!sql.isSqlValue(arg)) {
        throw new Error()
    }
    return new LiteralNode(arg)
}

export { id, raw, val }
