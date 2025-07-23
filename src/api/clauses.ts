import {
    type Node,
    type NodeArg,
    type NodeConstructor,
    toNode,
} from '~/core/node.ts'

import {
    FromNode,
    GroupByNode,
    HavingNode,
    JoinNode,
    JoinType,
    LimitNode,
    OffsetNode,
    OrderByNode,
    WhereNode,
} from '~/nodes/clauses.ts'

/** SQL FROM clause */
const from: NodeConstructor = (...args: NodeArg[]) => (): Node => {
    return new FromNode(args.map(toNode))
}

/** SQL WHERE clause */
const where: NodeConstructor = (...args: NodeArg[]) => (): Node =>
    new WhereNode(args.map(toNode))

/** SQL HAVING clause */
const having: NodeConstructor = (...args: NodeArg[]) => (): Node =>
    new HavingNode(args.map(toNode))

/** SQL GROUP BY clause */
const groupBy: NodeConstructor = (...args: NodeArg[]) => (): Node =>
    new GroupByNode(args.map(toNode))

/** SQL ORDER BY clause */
const orderBy: NodeConstructor = (...args: NodeArg[]) => (): Node =>
    new OrderByNode(args.map(toNode))

/** SQL LIMIT clause */
const limit: NodeConstructor = (...args: NodeArg[]) => (): Node => {
    const [count, offset] = args.map(toNode)
    return new LimitNode(count, offset)
}

/** SQL OFFSET clause */
const offset: NodeConstructor = (arg: NodeArg) => (): Node =>
    new OffsetNode(toNode(arg))

export { from, groupBy, having, limit, offset, orderBy, where }

// ---

const joinConstructor =
    (type: JoinType) => (...args: NodeArg[]) => (): Node => {
        const [table, condition] = args.map(toNode)
        return new JoinNode(type, table, condition)
    }

/** SQL INNER JOIN clause */
const joinInner: NodeConstructor = joinConstructor(JoinType.Inner)

/** SQL LEFT JOIN clause */
const joinLeft: NodeConstructor = joinConstructor(JoinType.Left)

/** SQL LEFT OUTER JOIN clause */
const joinLeftOuter: NodeConstructor = joinConstructor(JoinType.LeftOuter)

/** SQL CROSS JOIN clause */
const joinCross: NodeConstructor = (arg: NodeArg) => (): Node =>
    new JoinNode(JoinType.Cross, toNode(arg))

export { joinCross, joinInner, joinLeft, joinLeftOuter }
