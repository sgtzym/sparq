import { type ArrayLike, castArray } from '~/core/utils.ts'
import { type SqlString, type SqlValue, toSqlValue } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { LiteralNode } from '~/ast-nodes.ts'
import { Column } from '~/api/column.ts'

// ---------------------------------------------
// ⚙️ Basics
// ---------------------------------------------

export type Param = SqlValue | boolean | Date | undefined

export interface Node {
    readonly priority?: number
    render(params: Parameters): SqlString
}

/** Node type guard */
function isNode(arg: any): arg is Node {
    return arg && typeof arg.render === 'function'
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
 * @param nodes
 * @param params
 * @returns
 */
export function renderAll(
    nodes: ArrayLike<Node>,
    params: Parameters,
): string[] {
    return castArray(nodes).map((n) => n.render(params))
}

/**
 * @param nodes
 * @param params
 * @returns
 */
export function renderAST(
    nodes: ArrayLike<Node>,
    params: Parameters,
): string {
    return renderAll([...sortAST(castArray(nodes))], params).join(' ')
}

// ---------------------------------------------
// ⚙️ Conversion
// ---------------------------------------------

export interface NodeConvertible {
    readonly node: Node
}

export type NodeArg = ArrayLike<Node | NodeConvertible | Param>

/** Node convertible type guard */
function isNodeConvertible(arg: any): arg is NodeConvertible {
    return arg && typeof arg === 'object' &&
        'node' in arg &&
        isNode(arg.node)
}

/** Converts args to Nodes */
export function toNode(arg: Node | NodeConvertible | Param): Node {
    if (isNode(arg)) return arg
    if (isNodeConvertible(arg)) return arg.node
    return new LiteralNode(toSqlValue(arg))
}
