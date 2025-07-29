// deno-fmt-ignore-file
import {
    type Node,
    type NodeArg,
    type NodeFactory,
    toNode
} from '~/core/node.ts'

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

// Set quantifiers ->

/**
 * Creates a set quantifier node factory.
 * @param {SetQuantifier} quantifier - Set quantifier
 * @returns Factory function for set quantifier nodes
 */
const setQuantifierFactory: (quantifier: SetQuantifier) => NodeFactory =
    (quantifier: SetQuantifier): NodeFactory => (arg?: NodeArg) => (): Node =>
        new SetQuantifierNode(quantifier, arg ? toNode(arg) : undefined)

const _distinct: NodeFactory = setQuantifierFactory(SET_QUANTIFIERS.DISTINCT)
const _all: NodeFactory = setQuantifierFactory(SET_QUANTIFIERS.ALL)

/**
 * DISTINCT set quantifier modifier
 */
function distinct(): () => Node
function distinct(field: NodeArg): () => Node
function distinct(field?: NodeArg) {
    return _distinct(field)
}

/**
 * ALL set quantifier modifier
 */
function all(): () => Node
function all(field: NodeArg): () => Node
function all(field?: NodeArg) {
    return _all(field)
}

export { all, distinct }

// Sorting directions ->

const sortingDirectionFactory: (dir: SortingDirection) => (arg: NodeArg) => () => Node = 
    (dir: SortingDirection) => (arg: NodeArg) => (): Node => {
        if (!arg) throw new Error(`${SortingDirectionNode.name}: expression required`)
        return new SortingDirectionNode(toNode(arg), dir)
    }

/**
 * ASC sorting direction modifier
 */
const asc: NodeFactory = sortingDirectionFactory(SORTING_DIRECTIONS.ASC)

/**
 * DESC sorting direction modifier
 */
const desc: NodeFactory = sortingDirectionFactory(SORTING_DIRECTIONS.DESC)

export { asc, desc }

// Alias (renaming) ->

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
