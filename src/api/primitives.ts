import { isIdentifier, isSqlValue } from '~/core/sql-types.ts'
import type { Node, NodeArg, NodeConstructor } from '~/core/node.ts'
import { IdentifierNode, LiteralNode, RawNode } from '~/nodes/primitives.ts'

/** Raw SQL value */
const raw: NodeConstructor = (arg: NodeArg) => (): Node => {
    if (!arg || !(typeof arg === 'string')) {
        throw new Error(`${arg} is not a string value`)
    }

    return new RawNode(arg)
}

/** Table/field identifier */
const id: NodeConstructor = (arg: NodeArg) => (): Node => {
    if (!isIdentifier(arg)) {
        throw new Error(`${arg} is not an identifier`)
    }

    return new IdentifierNode(arg)
}

/** Parameterized literal value */
const val: NodeConstructor = (arg: NodeArg) => (): Node => {
    if (!isSqlValue(arg)) {
        throw new Error(`${arg} is not a valid SQL value`)
    }

    return new LiteralNode(arg)
}

export { id, raw, val }
