import { BinaryNode, ComparisonOperator } from '@/nodes/binary.ts'
import { IdentifierNode, LiteralNode, RawNode } from '@/nodes/primitives.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/logical.ts'
import { WhereNode } from '@/nodes/where.ts'
import { SelectNode } from '@/nodes/select.ts'
import { TopModNode } from '../nodes/modifiers/top.ts'
import { DistinctModNode } from '../nodes/modifiers/distinct.ts'
import type { Node } from './node.ts'

export type LogicalExpr = () => LogicalNode
export type BinaryExpr = () => BinaryNode
type TopExpr = () => TopModNode
type DistinctExpr = () => DistinctModNode

export type SelectClause = () => SelectNode
export type SelectModifier = TopExpr | DistinctExpr

export type WhereClause = () => WhereNode

// ---

export const select =
    (...args: (string | SelectModifier)[]): SelectClause => () => {
        const nodes: Node[] = []

        for (const arg of args) {
            if (typeof arg === 'string') {
                nodes.push(new IdentifierNode(arg))
            } else {
                nodes.push(arg()) // modifier
            }
        }

        if (args.length === 0) nodes.push(new RawNode('*'))

        return new SelectNode(nodes)
    }

export const where =
    (...node: (BinaryExpr | LogicalExpr)[]): WhereClause => () =>
        new WhereNode(node.map((n) => n()))

// ---

const logicalConstructor =
    (operator: LogicalOperator) =>
    (...node: (BinaryExpr | LogicalExpr)[]) =>
    () => new LogicalNode(operator, node.map((n) => n()))

export const and = logicalConstructor(LogicalOperator.$and)
export const or = logicalConstructor(LogicalOperator.$or)
export const not = logicalConstructor(LogicalOperator.$not)

// ---

const binaryConstructor =
    (operator: ComparisonOperator) =>
    (column: string, value: any): BinaryExpr =>
    () =>
        new BinaryNode(
            new IdentifierNode(column),
            operator,
            new LiteralNode(value),
        )

export const eq = binaryConstructor(ComparisonOperator.$eq)
export const ne = binaryConstructor(ComparisonOperator.$ne)
export const lt = binaryConstructor(ComparisonOperator.$lt)
export const le = binaryConstructor(ComparisonOperator.$le)
export const gt = binaryConstructor(ComparisonOperator.$gt)
export const ge = binaryConstructor(ComparisonOperator.$ge)
export const like = binaryConstructor(ComparisonOperator.$like)

// ---

export const count = null
export const alias = null

// ---

export const distinct = () => () => new DistinctModNode()
export const top = (count: number) => () => new TopModNode(count)
