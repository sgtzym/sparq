import { type Node, type NodeArg, type NodeFactory, toNode } from '~/core/node.ts'

import {
    AliasNode,
    SET_QUANTIFIERS,
    type SetQuantifier,
    SetQuantifierNode,
    SORTING_DIRECTIONS,
    type SortingDirection,
    SortingDirectionNode,
} from '~/ast-nodes/modifiers.ts'

/** SQL modifier node factories 🏭 */

// -> Set quantifiers

/**
 * Creates a set quantifier node factory.
 * @param {SetQuantifier} quantifier - Set quantifier
 * @returns Factory function for set quantifier nodes
 */
const setQuantifier: (quantifier: SetQuantifier) => NodeFactory =
    (quantifier: SetQuantifier): NodeFactory => (arg?: NodeArg) => (): Node =>
        new SetQuantifierNode(quantifier, arg ? toNode(arg) : undefined)

const _distinct: NodeFactory = setQuantifier(SET_QUANTIFIERS.DISTINCT)

/**
 * DISTINCT set quantifier modifier
 */
function distinct(): () => Node
function distinct(column: NodeArg): () => Node
function distinct(column?: NodeArg) {
    return _distinct(column)
}
const _all: NodeFactory = setQuantifier(SET_QUANTIFIERS.ALL)

/**
 * ALL set quantifier modifier
 */
function all(): () => Node
function all(column: NodeArg): () => Node
function all(column?: NodeArg) {
    return _all(column)
}

export { all, distinct }

// -> Sorting directions

const sortingDirection: (dir: SortingDirection) => (arg: NodeArg) => () => Node =
    (dir: SortingDirection) => (arg: NodeArg) => (): Node => {
        if (!arg) throw new Error(`${SortingDirectionNode.name}: expression required`)
        return new SortingDirectionNode(toNode(arg), dir)
    }

/**
 * ASC sorting direction modifier
 */
const asc: NodeFactory = sortingDirection(SORTING_DIRECTIONS.ASC)

/**
 * DESC sorting direction modifier
 */
const desc: NodeFactory = sortingDirection(SORTING_DIRECTIONS.DESC)

export { asc, desc }

// -> Alias (column/table aliasing)

/**
 * AS modifier
 *
 * @param expression - Lefthand expr (e.g., name or aggregate)
 * @param as - As name
 * @returns
 */
const alias: NodeFactory = (expression: NodeArg, as: NodeArg) => (): Node => {
    if (!expression || !as) throw new Error(`${AliasNode.name}: expression required`)
    return new AliasNode(toNode(expression), toNode(as))
}

export { alias }
