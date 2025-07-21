import type { Context } from '@/core/context.ts'
import { isIdentifier, type SqlValue } from '@/core/sql-types.ts'
import { IdentifierNode, LiteralNode, RawNode } from '@/nodes/primitives.ts'

/** Basic Node interface used for AST construction */
interface Node {
    interpret(ctx?: Context): string
}

type NodeValue = SqlValue | boolean | Date | undefined
type NodeArg = NodeValue | (() => Node) // value or node constructor (see api)

/**
 * Casts args to Nodes 🧼
 * @param arg any string, number or Node function - e.g. select()
 * @returns a single Node instance
 */
function toNode(
    arg: NodeArg,
): Node {
    if (typeof arg === 'function') return arg()

    return isIdentifier(arg)
        ? new IdentifierNode(arg)
        : new LiteralNode(arg as SqlValue)
}

/**
 * TODO: This needs a proper table/field checking mechanism (incl. auto-completion)
 * Check here if a str value is part of a scheme (either a table or a field name) and set Identifier/Literal Node accordingly
 * Sets could probably help here!
 */

export { type Node, type NodeArg, type NodeValue, toNode }
