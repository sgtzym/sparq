import { sql } from '~/core/sql.ts'
import type { Node, Param } from '~/core/node.ts'
import { IdentifierNode, LiteralNode, RawNode } from '~/ast-nodes/primitives.ts'

/** 🏭 Node factories: Primitives */

export const id = (name: string): Node => {
    if (!sql.isIdentifier(name)) {
        throw new Error(`${name} is not an identifier`)
    }
    return new IdentifierNode(name)
}

export const val = (value: Param): Node => {
    if (!sql.isSqlValue(value)) {
        throw new Error(`${value} is not a SQL value`)
    }
    return new LiteralNode(value)
}

export const raw = (sql: string): Node => {
    return new RawNode(sql)
}
