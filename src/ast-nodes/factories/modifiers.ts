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

// Set quantifiers

const setQuantifierFactory =
    (quantifier: SetQuantifier): NodeFactory => (arg?: NodeArg) => (): Node =>
        new SetQuantifierNode(quantifier, arg ? toNode(arg) : undefined)

const _distinct = setQuantifierFactory(SET_QUANTIFIERS.DISTINCT)
const _all = setQuantifierFactory(SET_QUANTIFIERS.ALL)

function distinct(): () => Node
function distinct(field: NodeArg): () => Node
function distinct(field?: NodeArg) {
    return _distinct(field)
}

function all(): () => Node
function all(field: NodeArg): () => Node
function all(field?: NodeArg) {
    return _all(field)
}

export { all, distinct }

// Sorting directions

const sortingDirectionFactory = (dir: SortingDirection) => (arg: NodeArg) => (): Node => {
    if (!arg) throw new Error(`${SortingDirectionNode.name}: expression required`)
    return new SortingDirectionNode(toNode(arg), dir)
}

const asc = sortingDirectionFactory(SORTING_DIRECTIONS.ASC)
const desc = sortingDirectionFactory(SORTING_DIRECTIONS.DESC)

export { asc, desc }

// Alias

const alias = (expression: NodeArg, as: NodeArg) => (): Node => {
    if (!expression || !as) throw new Error(`${AliasNode.name}: expression required`)
    return new AliasNode(toNode(expression), toNode(as))
}

export { alias }
