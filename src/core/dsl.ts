import type { Node } from '@/core/node.ts'
import { type NodeArg, toNode } from '@/core/utils.ts'

import { RawNode } from '@/nodes/primitives.ts'
import { AliasNode } from '@/nodes/alias.ts'

import { BinaryNode, ComparisonOperator } from '@/nodes/binary.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/logical.ts'

import { SelectNode } from '@/nodes/clauses/select.ts'
import { FromNode } from '@/nodes/clauses/from.ts'
import { WhereNode } from '@/nodes/clauses/where.ts'
import { HavingNode } from '@/nodes/clauses/having.ts'
import { GroupByNode } from '@/nodes/clauses/group-by.ts'
import { OrderByNode } from '@/nodes/clauses/order-by.ts'
import { JoinNode, JoinType } from '@/nodes/clauses/join.ts'
import { LimitNode, OffsetNode } from '../nodes/clauses/limit.ts'

import {
    SetQuantifier,
    SetQuantifierNode,
    SortingDirection,
    SortingDirectionNode,
} from '@/nodes/modifiers.ts'

import { AggregateFunction, AggregateNode } from '@/nodes/aggregates.ts'

/** SQL SELECT clause */
const select = (...args: NodeArg[]) => (): Node => {
    const nodes: Node[] = args.map(toNode)
    if (nodes.length === 0) nodes.push(new RawNode('*'))

    return new SelectNode(nodes)
}

/** SQL FROM clause */
const from = (...args: NodeArg[]) => (): Node => {
    return new FromNode(args.map(toNode))
}

/** SQL WHERE clause */
const where = (...args: NodeArg[]) => (): Node =>
    new WhereNode(args.map(toNode))

/** SQL HAVING clause */
const having = (...args: NodeArg[]) => (): Node =>
    new HavingNode(args.map(toNode))

/** SQL GROUP BY clause */
const groupBy = (...args: NodeArg[]) => (): Node =>
    new GroupByNode(args.map(toNode))

/** SQL ORDER BY clause */
const orderBy = (...args: NodeArg[]) => (): Node =>
    new OrderByNode(args.map(toNode))

/** SQL LIMIT clause */
const limit = (...args: NodeArg[]) => (): Node => {
    if (args.length === 0) {
        throw new Error('limit requires at least one argument')
    }

    const [count, offset] = args.map(toNode)

    return new LimitNode(count, offset)
}

/** SQL OFFSET clause */
const offset = (arg: NodeArg) => (): Node => new OffsetNode(toNode(arg))

export { from, groupBy, having, limit, offset, orderBy, select, where }

// ---

const logicalConstructor =
    (operator: LogicalOperator) => (...args: NodeArg[]) => (): Node => {
        if (args.length < 2) {
            throw new Error('logical requires at least two arguments')
        }
        return new LogicalNode(operator, args.map(toNode))
    }

/** SQL AND operator */
const and = logicalConstructor(LogicalOperator.And)

/** SQL OR operator */
const or = logicalConstructor(LogicalOperator.Or)

/** SQL NOT operator */
const not = logicalConstructor(LogicalOperator.Not)

export { and, not, or }

// ---

const binaryConstructor =
    (operator: ComparisonOperator) => (...args: NodeArg[]) => (): Node => {
        if (args.length !== 2) {
            throw new Error('binary requires exactly two arguments')
        }
        const [left, right] = args
        return new BinaryNode(operator, toNode(left), toNode(right))
    }

/** SQL "=" operator */
const eq = binaryConstructor(ComparisonOperator.Eq)

/** SQL "!=" operator */
const ne = binaryConstructor(ComparisonOperator.Ne)

/** SQL "<" operator */
const lt = binaryConstructor(ComparisonOperator.Lt)

/** SQL "<=" operator */
const le = binaryConstructor(ComparisonOperator.Le)

/** SQL ">" operator */
const gt = binaryConstructor(ComparisonOperator.Gt)

/** SQL ">=" operator */
const ge = binaryConstructor(ComparisonOperator.Ge)

/** SQL LIKE operator */
const like = binaryConstructor(ComparisonOperator.Like)

export { eq, ge, gt, le, like, lt, ne }

// ---

const setQuantifierConstructor =
    (quantifier: SetQuantifier) => () => (): Node =>
        new SetQuantifierNode(quantifier)

/** SQL DISTINCT modifier */
const distinct = setQuantifierConstructor(SetQuantifier.Distinct)

/** SQL All modifier */
const all = setQuantifierConstructor(SetQuantifier.All)

export { all, distinct }

// ---

/** SQL AS keyword (alias) */
const alias = (...args: NodeArg[]) => (): Node => {
    if (args.length !== 2) {
        throw new Error('alias requires exactly two arguments')
    }
    const [name, asName] = args.map(toNode)
    return new AliasNode(name, asName)
}

export { alias }

// ---

const aggregateConstructor =
    (fn: AggregateFunction) => (...args: NodeArg[]) => (): Node => {
        const nodes: Node[] = args.map(toNode)
        if (nodes.length === 0) nodes.push(new RawNode(1))

        return new AggregateNode(fn, nodes)
    }

/** SQL AVG(...) function */
const avg = aggregateConstructor(AggregateFunction.Avg)

/** SQL COUNT(...) function */
const count = aggregateConstructor(AggregateFunction.Count)

/** SQL MIN(...) function */
const min = aggregateConstructor(AggregateFunction.Min)

/** SQL MAX(...) function */
const max = aggregateConstructor(AggregateFunction.Max)

/** SQL SUM(...) function */
const sum = aggregateConstructor(AggregateFunction.Sum)

export { avg, count, max, min, sum }

// ---

const joinConstructor =
    (type: JoinType) => (...args: NodeArg[]) => (): Node => {
        if (args.length !== 2) {
            throw new Error('join requires exactly two arguments')
        }
        const [table, condition] = args.map(toNode)
        return new JoinNode(type, table, condition)
    }

/** SQL INNER JOIN clause */
const joinInner = joinConstructor(JoinType.Inner)

/** SQL LEFT JOIN clause */
const joinLeft = joinConstructor(JoinType.Left)

/** SQL LEFT OUTER JOIN clause */
const joinLeftOuter = joinConstructor(JoinType.LeftOuter)

/** SQL CROSS JOIN clause */
const joinCross = (arg: NodeArg) => (): Node =>
    new JoinNode(JoinType.Cross, toNode(arg))

export { joinCross, joinInner, joinLeft, joinLeftOuter }

// ---

const sortingDirectionConstructor =
    (dir: SortingDirection) => (arg: NodeArg) => (): Node =>
        new SortingDirectionNode(dir, toNode(arg))

/** SQL ASC modifier */
const asc = sortingDirectionConstructor(SortingDirection.Asc)

/** SQL DESC modifier */
const desc = sortingDirectionConstructor(SortingDirection.Desc)

export { asc, desc }
