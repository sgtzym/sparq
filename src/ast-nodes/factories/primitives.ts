import { sql } from '~/core/sql.ts'
import type { Node, NodeArg } from '~/core/node.ts'
import { IdentifierNode, LiteralNode, RawNode } from '~/ast-nodes/primitives.ts'

const raw = (sql: string) => (): Node => {
    return new RawNode(sql)
}

const id = (name: NodeArg) => (): Node => {
    if (!sql.isIdentifier(name)) {
        throw new Error(`${name} is not an identifier`)
    }
    return new IdentifierNode(name)
}

const val = (arg: NodeArg) => (): Node => {
    if (!sql.isSqlValue(arg)) {
        throw new Error(`${arg} is not a SQL value`)
    }
    return new LiteralNode(arg)
}

export { id, raw, val }
