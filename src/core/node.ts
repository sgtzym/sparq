import type { Registry } from './registry.ts'
import { isIdentifier, type SqlValue } from '~/core/sql-types.ts'
import { IdentifierNode, LiteralNode } from '~/nodes/primitives.ts'

/** Extended SQL values */
type NodeValue = SqlValue | boolean | Date | undefined

/** Primitive or Node */
type NodeArg = NodeValue | (() => Node)

/** Node context (parameter handling) */
type NodeContext = Registry<SqlValue>

/** Basic Node interface used for AST construction */
interface Node {
    interpret(ctx?: NodeContext): string
}

/**
 * Constructor for API functions.
 * These functions need to resolve any arg to a Node.
 */
type NodeConstructor = (...args: NodeArg[]) => () => Node

/**
 * Casts args to Nodes 🧼
 * @param arg any string, number or Node function - e.g. select()
 * @returns a single Node instance
 */
function toNode(arg: NodeArg): Node {
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

export {
    type Node,
    type NodeArg,
    type NodeConstructor,
    type NodeContext,
    type NodeValue,
    toNode,
}
