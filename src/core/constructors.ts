import { BinaryNode, ComparisonOperator } from '@/nodes/binary.ts'
import { IdentifierNode, LiteralNode, RawNode } from '@/nodes/primitives.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/logical.ts'
import { FromNode } from '../nodes/clauses/from.ts'
import { SelectNode } from '../nodes/clauses/select.ts'
import { WhereNode } from '../nodes/clauses/where.ts'
import { TopNode } from '../nodes/modifiers/top.ts'
import { DistinctNode } from '../nodes/modifiers/distinct.ts'
import type { Node } from './node.ts'
import { AliasNode } from '../nodes/alias.ts'
import { AggregateFunction, AggregateNode } from '../nodes/aggregates.ts'
import { JoinNode, JoinType } from '../nodes/join.ts'

type Name = string | Alias

type Logical = () => LogicalNode
type Binary = () => BinaryNode
type Top = () => TopNode
type Distinct = () => DistinctNode
type Alias = () => AliasNode

type Aggregate = () => AggregateNode
type Join = () => JoinNode

export type FromClause = () => FromNode
export type SelectClause = () => SelectNode
export type WhereClause = () => WhereNode

// ---

export const from = (...args: (Name | Join)[]): FromClause => () => {
    const nodes: Node[] = args.map((arg) =>
        typeof arg === 'string' ? new IdentifierNode(arg) : arg()
    )

    return new FromNode(nodes)
}

// ---

export const select =
    (...args: (Top | Distinct | Name | Aggregate)[]): SelectClause => () => {
        const nodes: Node[] = args.map((arg) =>
            typeof arg === 'string' ? new IdentifierNode(arg) : arg()
        )

        if (nodes.length === 0) nodes.push(new RawNode('*'))

        return new SelectNode(nodes)
    }

export const where = (...args: (Binary | Logical)[]): WhereClause => () =>
    new WhereNode(args.map((n) => n()))

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

export const distinct = (): Distinct => () => new DistinctNode()
export const top = (count: number): Top => () => new TopNode(count)

// ---

export const alias = (name: string | Aggregate, asName: string): Alias => () =>
    new AliasNode(
        typeof name === 'string' ? new IdentifierNode(name) : name(),
        new IdentifierNode(asName),
    )

// ---

const aggregateConstructor =
    (fn: AggregateFunction) =>
    (...args: (string | Distinct)[]): Aggregate =>
    () => {
        const nodes: Node[] = args.map((arg) =>
            typeof arg === 'string' ? new IdentifierNode(arg) : arg()
        )

        if (nodes.length === 0) nodes.push(new RawNode('1'))

        return new AggregateNode(fn, nodes)
    }

export const avg = aggregateConstructor(AggregateFunction.Avg)
export const min = aggregateConstructor(AggregateFunction.Min)
export const max = aggregateConstructor(AggregateFunction.Max)
export const count = aggregateConstructor(AggregateFunction.Count)
export const sum = aggregateConstructor(AggregateFunction.Sum)

// ---

const joinConstructor =
    (type: JoinType) => (table: string, condition: Binary): Join => () =>
        new JoinNode(type, new IdentifierNode(table), condition())

export const joinInner = joinConstructor(JoinType.Inner)
export const joinLeft = joinConstructor(JoinType.Left)
export const joinLeftOuter = joinConstructor(JoinType.LeftOuter)

export const joinCross = (table: string): Join => () =>
    new JoinNode(JoinType.Cross, new IdentifierNode(table))
