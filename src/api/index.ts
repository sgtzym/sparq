import { type Node, type NodeArg, toNode } from '@/core/node.ts'

import { IdentifierNode, LiteralNode, RawNode } from '@/nodes/primitives.ts'
import { AliasNode } from '@/nodes/alias.ts'

import { BinaryNode, ComparisonOperator } from '@/nodes/expressions/binary.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/expressions/logical.ts'

import { SelectNode } from '@/nodes/clauses/select.ts'
import { FromNode } from '@/nodes/clauses/from.ts'
import { WhereNode } from '@/nodes/clauses/where.ts'
import { HavingNode } from '@/nodes/clauses/having.ts'
import { GroupByNode } from '@/nodes/clauses/group-by.ts'
import { OrderByNode } from '@/nodes/clauses/order-by.ts'
import { JoinNode, JoinType } from '@/nodes/clauses/join.ts'
import { LimitNode, OffsetNode } from '@/nodes/clauses/limit.ts'

import {
    SetQuantifier,
    SetQuantifierNode,
    SortingDirection,
    SortingDirectionNode,
} from '@/nodes/modifiers.ts'

import {
    AggregateFunction,
    AggregateNode,
} from '@/nodes/expressions/aggregates.ts'
import { isIdentifier, isSqlValue } from '../core/sqlite.ts'

type NodeConstructor = (...args: NodeArg[]) => () => Node

/** SQL SELECT clause */
const select: NodeConstructor = (...args: NodeArg[]) => (): Node => {
    const nodes: Node[] = args.map(toNode)
    if (nodes.length === 0) nodes.push(new RawNode('*'))

    return new SelectNode(nodes)
}

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

export { from, groupBy, having, limit, offset, orderBy, select, where }

// ---

const logicalConstructor =
    (operator: LogicalOperator) => (...args: NodeArg[]) => (): Node => {
        return new LogicalNode(operator, args.map(toNode))
    }

/** SQL AND operator */
const and: NodeConstructor = logicalConstructor(
    LogicalOperator.And,
)

/** SQL OR operator */
const or: NodeConstructor = logicalConstructor(
    LogicalOperator.Or,
)

/** SQL NOT operator */
const not: NodeConstructor = logicalConstructor(
    LogicalOperator.Not,
)

export { and, not, or }

// ---

const binaryConstructor =
    (operator: ComparisonOperator) => (...args: NodeArg[]) => (): Node => {
        const [left, right] = args
        return new BinaryNode(operator, toNode(left), toNode(right))
    }

/** SQL "=" operator */
const eq: NodeConstructor = binaryConstructor(ComparisonOperator.Eq)

/** SQL "!=" operator */
const ne: NodeConstructor = binaryConstructor(ComparisonOperator.Ne)

/** SQL "<" operator */
const lt: NodeConstructor = binaryConstructor(ComparisonOperator.Lt)

/** SQL "<=" operator */
const le: NodeConstructor = binaryConstructor(ComparisonOperator.Le)

/** SQL ">" operator */
const gt: NodeConstructor = binaryConstructor(ComparisonOperator.Gt)

/** SQL ">=" operator */
const ge: NodeConstructor = binaryConstructor(ComparisonOperator.Ge)

/** SQL IN operator */
const in_: NodeConstructor = binaryConstructor(ComparisonOperator.In)

/** SQL LIKE operator */
const like: NodeConstructor = binaryConstructor(ComparisonOperator.Like)

export { eq, ge, gt, in_, le, like, lt, ne }

// ---

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

/** SQL AS keyword (alias) */
const alias: NodeConstructor = (...args: NodeArg[]) => (): Node => {
    const [name, asName] = args.map(toNode)
    return new AliasNode(name, asName)
}

export { alias }

// ---

const aggregateConstructor =
    (fn: AggregateFunction) => (...args: NodeArg[]) => (): Node => {
        const nodes: Node[] = args.map(toNode)
        if (nodes.length === 0) nodes.push(new RawNode(String(1)))

        return new AggregateNode(fn, nodes)
    }

/** SQL AVG(...) function */
const avg: NodeConstructor = aggregateConstructor(AggregateFunction.Avg)

/** SQL COUNT(...) function */
const count: NodeConstructor = aggregateConstructor(AggregateFunction.Count)

/** SQL MIN(...) function */
const min: NodeConstructor = aggregateConstructor(AggregateFunction.Min)

/** SQL MAX(...) function */
const max: NodeConstructor = aggregateConstructor(AggregateFunction.Max)

/** SQL SUM(...) function */
const sum: NodeConstructor = aggregateConstructor(AggregateFunction.Sum)

export { avg, count, max, min, sum }

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

// ---

const sortingDirectionConstructor =
    (dir: SortingDirection) => (arg: NodeArg) => (): Node =>
        new SortingDirectionNode(dir, toNode(arg))

/** SQL ASC modifier */
const asc: NodeConstructor = sortingDirectionConstructor(SortingDirection.Asc)

/** SQL DESC modifier */
const desc: NodeConstructor = sortingDirectionConstructor(SortingDirection.Desc)

export { asc, desc }

// ---

/** Raw SQL value */
const raw: NodeConstructor = (arg: NodeArg) => (): Node => {
    if (!arg || !(typeof arg === 'string')) {
        throw new Error(`${arg} is not a string value`)
    }

    return new RawNode(arg)
}

/** Table/field identifier */
const id: NodeConstructor = (arg: NodeArg) => (): Node => {
    if (!isIdentifier(arg)) {
        throw new Error(`${arg} is not a identifier`)
    }

    return new IdentifierNode(arg)
}

/** Parameterized literal value */
const val: NodeConstructor = (arg: NodeArg) => (): Node => {
    if (!isSqlValue(arg)) {
        throw new Error(`${arg} is not a valid SQL value`)
    }

    return new LiteralNode(arg)
}

export { id, raw, val }
