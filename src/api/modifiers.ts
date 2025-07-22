import {
    type Node,
    type NodeArg,
    type NodeConstructor,
    toNode,
} from '~/core/node.ts'

import {
    SetQuantifier,
    SetQuantifierNode,
    SortingDirection,
    SortingDirectionNode,
} from '~/nodes/modifiers.ts'

const setQuantifierConstructor =
    (quantifier: SetQuantifier) => () => (): Node =>
        new SetQuantifierNode(quantifier)

/** SQL DISTINCT modifier */
const distinct: NodeConstructor = setQuantifierConstructor(
    SetQuantifier.Distinct,
)

/** SQL All modifier */
const all: NodeConstructor = setQuantifierConstructor(SetQuantifier.All)

export { all, distinct }

// ---

const sortingDirectionConstructor =
    (dir: SortingDirection) => (arg: NodeArg) => (): Node =>
        new SortingDirectionNode(dir, toNode(arg))

/** SQL ASC modifier */
const asc: NodeConstructor = sortingDirectionConstructor(SortingDirection.Asc)

/** SQL DESC modifier */
const desc: NodeConstructor = sortingDirectionConstructor(SortingDirection.Desc)

export { asc, desc }
