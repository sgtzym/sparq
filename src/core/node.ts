import type { Context } from '@/core/context.ts'
import { isIdentifier, type SqlValue } from './sqlite.ts'
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
function toNode(arg: NodeArg): Node {
    return typeof arg === 'function'
        ? arg()
        : new RawNode('x')
        // : isIdentifier(arg)
        // ? new IdentifierNode(arg)
        // : new LiteralNode(arg as SqlValue)
}

export { type Node, type NodeArg, type NodeValue, toNode }
