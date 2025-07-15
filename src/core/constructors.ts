import { BinaryNode, ComparisonOperator } from '@/nodes/binary.ts'
import { IdentifierNode, LiteralNode, RawNode } from '@/nodes/primitives.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/logical.ts'
import { WhereNode } from '@/nodes/where.ts'
import { SelectNode } from '@/nodes/select.ts'
import { TopNode } from '../nodes/modifiers/top.ts'
import { DistinctNode } from '../nodes/modifiers/distinct.ts'
import type { Node } from './node.ts'
import { AliasNode } from '../nodes/modifiers/alias.ts'
import { AggregateFunction, AggregateNode } from '../nodes/aggregates.ts'

type Logical = () => LogicalNode
type Binary = () => BinaryNode
type Top = () => TopNode
type Distinct = () => DistinctNode
type Alias = () => AliasNode
type Count = () => AggregateNode
type Sum = () => AggregateNode
type Aggregate = Count | Sum

export type SelectClause = () => SelectNode
export type WhereClause = () => WhereNode

// ---

export const select =
    (...args: (Top | Distinct | string | Alias | Aggregate)[]): SelectClause =>
    () => {
        const modifiers: Node[] = []
        const fields: Node[] = []

        for (const arg of args) {
            if (typeof arg === 'string') {
                fields.push(new IdentifierNode(arg))
            } else {
                modifiers.push(arg()) // modifier
            }
        }

        if (fields.length === 0) fields.push(new RawNode('*'))

        return new SelectNode([...modifiers, ...fields])
    }

export const where = (...args: (Binary | Logical)[]): WhereClause => () =>
    new WhereNode(args.map((n) => n()))

// ---

const logicalConstructor =
    (operator: LogicalOperator) => (...args: (Binary | Logical)[]) => () =>
        new LogicalNode(operator, args.map((n) => n()))

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

export const alias = (name: string | Count, asName: string): Alias => () =>
    new AliasNode(
        typeof name === 'string' ? new IdentifierNode(name) : name(),
        new IdentifierNode(asName),
    )

// ---

const aggregateConstructor =
    (fn: AggregateFunction) => (...args: (string | Distinct)[]): Count =>
    () => {
        const modifiers: Node[] = []
        const fields: Node[] = []

        for (const arg of args) {
            if (typeof arg === 'string') {
                fields.push(new IdentifierNode(arg))
            } else {
                modifiers.push(arg()) // modifier
            }
        }

        if (fields.length === 0) fields.push(new RawNode('1'))

        return new AggregateNode(fn, [...modifiers, ...fields])
    }

export const avg = aggregateConstructor(AggregateFunction.Avg)
export const min = aggregateConstructor(AggregateFunction.Min)
export const max = aggregateConstructor(AggregateFunction.Max)
export const count = aggregateConstructor(AggregateFunction.Count)
export const sum = aggregateConstructor(AggregateFunction.Sum)
