import { BinaryNode, ComparisonOperator } from '@/nodes/binary.ts'
import { IdentifierNode, RawNode } from '@/nodes/primitives.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/logical.ts'
import { FromNode } from '@/nodes/clauses/from.ts'
import { SelectNode } from '@/nodes/clauses/select.ts'
import { WhereNode } from '@/nodes/clauses/where.ts'
import {
    SetQuantifier,
    SetQuantifierNode,
    SortingDirection,
    SortingDirectionNode,
} from '@/nodes/modifiers.ts'
import type { Node } from '@/core/node.ts'
import { AliasNode } from '@/nodes/alias.ts'
import { AggregateFunction, AggregateNode } from '@/nodes/aggregates.ts'
import { JoinNode, JoinType } from '@/nodes/clauses/join.ts'
import { LimitNode, OffsetNode } from '@/nodes/limit.ts'
import { GroupByNode } from '@/nodes/clauses/group-by.ts'
import { OrderByNode } from '@/nodes/clauses/order-by.ts'
import { HavingNode } from '@/nodes/clauses/having.ts'

type NodeArg = number | string | (() => Node)

// 🧙‍♂️ Cast args to Nodes
function toNode(arg: NodeArg) {
    return typeof arg === 'function'
        ? arg()
        : typeof arg === 'number'
        ? new RawNode(arg)
        : new IdentifierNode(arg)
}

export { type NodeArg, toNode }

// ---

const select = (...args: NodeArg[]) => (): Node => {
    const nodes: Node[] = args.map(toNode)
    if (nodes.length === 0) nodes.push(new RawNode('*'))

    return new SelectNode(nodes)
}

const from = (...args: NodeArg[]) => (): Node => {
    return new FromNode(args.map(toNode))
}

const where = (...args: NodeArg[]) => (): Node =>
    new WhereNode(args.map(toNode))

const having = (...args: NodeArg[]) => (): Node =>
    new HavingNode(args.map(toNode))

// ---

const groupBy = (...args: NodeArg[]) => (): Node =>
    new GroupByNode(args.map((n) => toNode(n)))

// ---

const limit = (...args: NodeArg[]) => (): Node => {
    if (args.length === 0) {
        throw new Error('limit requires at least one argument')
    }

    const [count, offset] = args.map(toNode)

    return new LimitNode(count, offset)
}

const offset = (arg: NodeArg) => (): Node => new OffsetNode(toNode(arg))

const orderBy = (...args: NodeArg[]) => (): Node =>
    new OrderByNode(args.map(toNode))

export { from, groupBy, having, limit, offset, orderBy, select, where }

// ---

const logicalConstructor =
    (operator: LogicalOperator) => (...args: NodeArg[]) => (): Node =>
        new LogicalNode(operator, args.map(toNode))

const and = logicalConstructor(LogicalOperator.And)
const or = logicalConstructor(LogicalOperator.Or)
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

const eq = binaryConstructor(ComparisonOperator.Eq)
const ne = binaryConstructor(ComparisonOperator.Ne)
const lt = binaryConstructor(ComparisonOperator.Lt)
const le = binaryConstructor(ComparisonOperator.Le)
const gt = binaryConstructor(ComparisonOperator.Gt)
const ge = binaryConstructor(ComparisonOperator.Ge)
const like = binaryConstructor(ComparisonOperator.Like)

export { eq, ge, gt, le, like, lt, ne }

// ---

const setQuantifierConstructor =
    (quantifier: SetQuantifier) => () => (): Node =>
        new SetQuantifierNode(quantifier)

const distinct = setQuantifierConstructor(SetQuantifier.Distinct)
const all = setQuantifierConstructor(SetQuantifier.All)

export { all, distinct }

// ---

export const alias = (...args: NodeArg[]) => (): Node => {
    if (args.length !== 2) {
        throw new Error('alias requires exactly two arguments')
    }
    const [name, asName] = args.map(toNode)
    return new AliasNode(name, asName)
}

// ---

const aggregateConstructor =
    (fn: AggregateFunction) => (...args: NodeArg[]) => (): Node => {
        const nodes: Node[] = args.map(toNode)
        if (nodes.length === 0) nodes.push(new RawNode(1))

        return new AggregateNode(fn, nodes)
    }

const avg = aggregateConstructor(AggregateFunction.Avg)
const min = aggregateConstructor(AggregateFunction.Min)
const max = aggregateConstructor(AggregateFunction.Max)
const count = aggregateConstructor(AggregateFunction.Count)
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

const joinInner = joinConstructor(JoinType.Inner)
const joinLeft = joinConstructor(JoinType.Left)
const joinLeftOuter = joinConstructor(JoinType.LeftOuter)

const joinCross = (arg: NodeArg) => (): Node =>
    new JoinNode(JoinType.Cross, toNode(arg))

export { joinCross, joinInner, joinLeft, joinLeftOuter }

// ---

const sortingDirectionConstructor =
    (dir: SortingDirection) => (arg: NodeArg) => (): Node =>
        new SortingDirectionNode(dir, toNode(arg))

const asc = sortingDirectionConstructor(SortingDirection.Asc)
const desc = sortingDirectionConstructor(SortingDirection.Desc)

export { asc, desc }
