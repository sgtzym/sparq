import { type ArrayLike, castArray } from '~/core/utils.ts'
import { type SqlString, type SqlValue, toSqlValue } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { LiteralNode } from '~/ast-nodes.ts'

// ---------------------------------------------
// ⚙️ Basics
// ---------------------------------------------

export type Param = SqlValue | boolean | Date | undefined
export type NodeArg = ArrayLike<Node | Param>

export interface Node {
    priority?: number
    render(params: Parameters): SqlString
}

/** Node type guard */
function isNode(arg: any): arg is Node {
    return arg && typeof arg.render === 'function'
}

/** Converts args like factory functions to Nodes */
export function toNode(arg: NodeArg): Node {
    return (isNode(arg)) ? arg : new LiteralNode(toSqlValue(arg))
}

// ---------------------------------------------
// ⚙️ Sorting and Rendering
// ---------------------------------------------

/**
 * @param nodes
 * @param prio
 * @returns
 */
export function sortAST(nodes: Node[]): readonly Node[] {
    return [...nodes].sort((a, b) => {
        const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER
        const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER

        return aPriority - bPriority
    })
}

/**
 * Renders multiple nodes to SQL strings.
 *
 * @param {ArrayLike<Node>} args - Nodes to interpret
 * @param {Parameters} params - Parameter registry for value binding
 * @returns {string[]} Array of SQL string fragments
 */
export function renderAll(
    args: ArrayLike<Node>,
    params: Parameters,
): string[] {
    return castArray(args).map((arg) => arg.render(params))
}

/**
 * Renders AST nodes to SQL in the specified clause order.
 * Groups nodes by type to ensure correct SQL syntax.
 *
 * @param {Node[]} nodes - AST nodes to render
 * @param {Parameters} params - Parameter registry for value binding
 * @param {string[]} order - Node type names in SQL clause order
 * @returns {string} Generated SQL string
 */
export function renderAST(
    nodes: Node[],
    params: Parameters,
): string {
    const nodeMap = new Map<string, Node[]>()
    const types: string[] = []

    for (const node of sortAST(nodes)) {
        const type: string = node.constructor.name
        if (!nodeMap.has(type)) {
            nodeMap.set(type, [])
            types.push(type)
        }
        nodeMap.get(type)!.push(node)
    }

    console.log(types)

    const parts: string[] = []

    for (const type of types) {
        const nodes = nodeMap.get(type) || []
        parts.push(...renderAll(nodes, params))
    }

    return parts.join(' ')
}
