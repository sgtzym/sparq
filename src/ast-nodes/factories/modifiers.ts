import { type NodeExpr, type Node, toNode } from '~/core/node.ts'
import {
    AliasNode,
    SET_QUANTIFIERS,
    type SetQuantifier,
    SetQuantifierNode,
    SORTING_DIRECTIONS,
    type SortingDirection,
    SortingDirectionNode,
} from '~/ast-nodes/modifiers.ts'

// Set quantifiers
const quantifier = (q: SetQuantifier) => (expr?: NodeExpr): Node =>
    new SetQuantifierNode(q, expr ? toNode(expr) : undefined)

export const distinct = quantifier(SET_QUANTIFIERS.DISTINCT)
export const all = quantifier(SET_QUANTIFIERS.ALL)

// Sorting directions
const sortDir = (dir: SortingDirection) => (expr: NodeExpr): Node => {
    if (!expr) throw new Error('Sorting direction requires an expr')
    return new SortingDirectionNode(toNode(expr), dir)
}

export const asc = sortDir(SORTING_DIRECTIONS.ASC)
export const desc = sortDir(SORTING_DIRECTIONS.DESC)

// Alias
export const alias = (expr: NodeExpr, as: NodeExpr): Node => {
    if (!expr || !as) {
        throw new Error('Alias requires both expr and name')
    }
    return new AliasNode(toNode(expr), toNode(as))
}
