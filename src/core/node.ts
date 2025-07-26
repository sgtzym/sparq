import { type ArrayLike, castArray } from '~/core/utils.ts'
import { sql, type SqlValue } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { IdentifierNode, LiteralNode } from '~/ast-nodes/primitives.ts'

/** Extended SQL values */
export type NodeValue = SqlValue | boolean | Date | undefined

/** Primitive or Node */
export type NodeArg = NodeValue | (() => Node)

/** Basic Node interface used for AST construction */
export interface Node {
    interpret(params: Parameters): string
}

/**
 * Constructor for API functions.
 * These functions need to resolve any arg to a Node.
 */
export type NodeFactory = (...args: NodeArg[]) => () => Node

/**
 * Casts args to Nodes 🧼
 * @param arg any string, number or Node function - e.g. select()
 * @returns a single Node instance
 */
export function toNode(arg: NodeArg): Node {
    if (typeof arg === 'function') return arg()

    /**
     * TODO: This needs a proper table/field checking mechanism (incl. auto-completion)
     * Check here if a str value is part of a scheme (either a table or a field name) and set Identifier/Literal Node accordingly
     * Sets could probably help here!
     */
    return sql.isIdentifier(arg) ? new IdentifierNode(arg) : new LiteralNode(arg as SqlValue)
}

/** */
export function interpretAll(nodes: ArrayLike<Node>, params: Parameters): string[] {
    return castArray(nodes).map((n) => n.interpret(params))
}
