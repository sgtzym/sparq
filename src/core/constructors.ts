import { BinaryNode, ComparisonOperator } from '@/nodes/binary.ts'
import { IdentifierNode, LiteralNode } from '@/nodes/primitives.ts'
import { LogicalNode, LogicalOperator } from '@/nodes/logical.ts'
import { WhereNode } from '@/nodes/where.ts'
import { SelectNode } from '@/nodes/select.ts'

export type SelectCtor = () => SelectNode
export type WhereCtor = () => WhereNode
export type LogicalCtor = () => LogicalNode
export type BinaryCtor = () => BinaryNode

// ---

export const select = (...column: string[]): SelectCtor => () =>
    new SelectNode(column.map((c) => new IdentifierNode(c)))

export const where = (...node: (BinaryCtor | LogicalCtor)[]): WhereCtor => () =>
    new WhereNode(node.map((n) => n()))

// ---

const logicalConstructor =
    (operator: LogicalOperator) =>
    (...node: (BinaryCtor | LogicalCtor)[]) =>
    () => new LogicalNode(operator, node.map((n) => n()))

export const and = logicalConstructor(LogicalOperator.$and)
export const or = logicalConstructor(LogicalOperator.$or)
export const not = logicalConstructor(LogicalOperator.$not)

// ---

const binaryConstructor =
    (operator: ComparisonOperator) =>
    (column: string, value: any): BinaryCtor =>
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
