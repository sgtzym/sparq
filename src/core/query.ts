import type { SupportedValueType } from 'node:sqlite'
import type { SelectCtor, WhereCtor } from '@/core/constructors.ts'
import { Context } from '@/core/context.ts'
import type { Node } from './node.ts'
import { SelectNode } from '../nodes/select.ts'
import { WhereNode } from '../nodes/where.ts'

export const query = (
    ...clauses: (SelectCtor | WhereCtor)[]
): [string, SupportedValueType] => {
    const ctx = new Context()
    const sql: Map<string, string> = new Map()
    const clauseOrder: string[] = [SelectNode.name, WhereNode.name]

    clauses.forEach((clause) => {
        const node: Node = clause()
        const clauseName: string = node.constructor.name

        sql.set(clauseName, node.interpret(ctx))
    })

    return [
        clauseOrder.filter((name) => sql.has(name))
            .map((name) => sql.get(name))
            .join(' '),
        ctx.values,
    ]
}
