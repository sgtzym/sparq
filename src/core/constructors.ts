import { BinaryNode, ComparisonOperator } from '@/nodes/binary.ts'
import { IdentifierNode, LiteralNode, RawNode } from '@/nodes/primitives.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/logical.ts'
import { FromNode } from '../nodes/clauses/from.ts'
import { SelectNode } from '../nodes/clauses/select.ts'
import { WhereNode } from '../nodes/clauses/where.ts'
import {
    SetQuantifierKeyword,
    SetQuantifierNode,
    SortingDirectionKeyword,
    SortingDirectionNode,
} from '../nodes/modifiers.ts'
import type { Node } from './node.ts'
import { AliasNode } from '../nodes/alias.ts'
import { AggregateFunction, AggregateNode } from '../nodes/aggregates.ts'
import { JoinNode, JoinType } from '../nodes/clauses/join.ts'
import { LimitNode, OffsetNode } from '../nodes/limit.ts'
import { GroupByNode } from '../nodes/clauses/group-by.ts'
import { OrderByNode } from '../nodes/clauses/order-by.ts'

type Name = string | Alias

type Logical = () => LogicalNode
type Binary = () => BinaryNode

type SetQuantifier = () => SetQuantifierNode // DISTINCT, ALL

type Alias = () => AliasNode

type Offset = () => OffsetNode
type SortingDirection = () => SortingDirectionNode

type Aggregate = () => AggregateNode

export type SelectClause = () => SelectNode
export type FromClause = () => FromNode
export type JoinClause = () => JoinNode
export type WhereClause = () => WhereNode
export type GroupByClause = () => GroupByNode
export type OrderByClause = () => OrderByNode
export type LimitClause = () => LimitNode

// ---

export const from = (...args: Name[]): FromClause => () => {
    const nodes: Node[] = args.map((arg) =>
        typeof arg === 'string' ? new IdentifierNode(arg) : arg()
    )

    return new FromNode(nodes)
}

// ---

export const select =
    (...args: (SetQuantifier | Name | Aggregate)[]): SelectClause => () => {
        const nodes: Node[] = args.map((arg) =>
            typeof arg === 'string' ? new IdentifierNode(arg) : arg()
        )

        if (nodes.length === 0) nodes.push(new RawNode('*'))

        return new SelectNode(nodes)
    }

export const where = (...args: (Binary | Logical)[]): WhereClause => () =>
    new WhereNode(args.map((n) => n()))

// ---

export const groupBy =
    (...args: (string | Aggregate)[]): GroupByClause => () => {
        const nodes: Node[] = args.map((arg) =>
            typeof arg === 'string' ? new IdentifierNode(arg) : arg()
        )

        return new GroupByNode(nodes)
    }

// ---

export const limit = (count: number, offset?: Offset): LimitClause => () =>
    new LimitNode(
        new RawNode(count),
        offset ? offset() : undefined,
    )

export const offset = (count: number): Offset => () =>
    new OffsetNode(new RawNode(count))

// ---

export const orderBy =
    (...args: (string | SortingDirection)[]): OrderByClause => () => {
        const nodes: Node[] = args.map((arg) =>
            typeof arg === 'string' ? new IdentifierNode(arg) : arg()
        )

        return new OrderByNode(nodes)
    }

// ---

const logicalConstructor =
    (operator: LogicalOperator) =>
    (...args: (Binary | Logical)[]): Logical =>
    () => new LogicalNode(operator, args.map((n) => n()))

export const and = logicalConstructor(LogicalOperator.And)
export const or = logicalConstructor(LogicalOperator.Or)
export const not = logicalConstructor(LogicalOperator.Not)

// ---

const binaryConstructor =
    (operator: ComparisonOperator) =>
    (field: string, value: any): Binary =>
    () =>
        new BinaryNode(
            new IdentifierNode(field),
            operator,
            new LiteralNode(value),
        )

export const eq = binaryConstructor(ComparisonOperator.Eq)
export const ne = binaryConstructor(ComparisonOperator.Ne)
export const lt = binaryConstructor(ComparisonOperator.Lt)
export const le = binaryConstructor(ComparisonOperator.Le)
export const gt = binaryConstructor(ComparisonOperator.Gt)
export const ge = binaryConstructor(ComparisonOperator.Ge)
export const like = binaryConstructor(ComparisonOperator.Like)

// ---

const setQuantifierConstructor =
    (quantifier: SetQuantifierKeyword) => (): SetQuantifier => () =>
        new SetQuantifierNode(quantifier)

export const distinct = setQuantifierConstructor(SetQuantifierKeyword.Distinct)
export const all = setQuantifierConstructor(SetQuantifierKeyword.All)

// ---

export const alias = (name: string | Aggregate, asName: string): Alias => () =>
    new AliasNode(
        typeof name === 'string' ? new IdentifierNode(name) : name(),
        new IdentifierNode(asName),
    )

// ---

const aggregateConstructor =
    (fn: AggregateFunction) =>
    (...args: (string | SetQuantifier)[]): Aggregate =>
    () => {
        const nodes: Node[] = args.map((arg) =>
            typeof arg === 'string' ? new IdentifierNode(arg) : arg()
        )

        if (nodes.length === 0) nodes.push(new RawNode(1))

        return new AggregateNode(fn, nodes)
    }

export const avg = aggregateConstructor(AggregateFunction.Avg)
export const min = aggregateConstructor(AggregateFunction.Min)
export const max = aggregateConstructor(AggregateFunction.Max)
export const count = aggregateConstructor(AggregateFunction.Count)
export const sum = aggregateConstructor(AggregateFunction.Sum)

// ---

const joinConstructor =
    (type: JoinType) => (table: string, condition: Binary): JoinClause => () =>
        new JoinNode(type, new IdentifierNode(table), condition())

export const joinInner = joinConstructor(JoinType.Inner)
export const joinLeft = joinConstructor(JoinType.Left)
export const joinLeftOuter = joinConstructor(JoinType.LeftOuter)

export const joinCross = (table: string): JoinClause => () =>
    new JoinNode(JoinType.Cross, new IdentifierNode(table))

// ---

const sortingDirectionConstructor =
    (dir: SortingDirectionKeyword) => (field: string): SortingDirection => () =>
        new SortingDirectionNode(dir, new IdentifierNode(field))

export const asc = sortingDirectionConstructor(SortingDirectionKeyword.Asc)
export const desc = sortingDirectionConstructor(SortingDirectionKeyword.Desc)
