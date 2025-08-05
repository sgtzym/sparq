import { type ArrayLike, castArray } from '~/core/utils.ts'
import { type SqlString, type SqlValue, toSqlValue } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { LiteralNode } from '~/ast-nodes.ts'
import { Column } from '~/api/column.ts'

// ---------------------------------------------
// ⚙️ Basics
// ---------------------------------------------

export type Param = SqlValue | boolean | Date | undefined
export type NodeArg = ArrayLike<Node | Param | Column> // fucking cross-ref for Column

export interface Node {
    readonly priority?: number
    render(params: Parameters): SqlString
}

/** Node type guard */
function isNode(arg: any): arg is Node {
    return arg && typeof arg.render === 'function'
}

/** Converts args like factory functions to Nodes */
export function toNode(arg: NodeArg): Node {
    if ((isNode(arg))) return arg
    if (arg instanceof Column) return arg.node

    return new LiteralNode(toSqlValue(arg))
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
