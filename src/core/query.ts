import type { SupportedValueType } from 'node:sqlite'
import type { SelectCtor, WhereCtor } from './constructors.ts'
import { Context } from './context.ts'

export class Query {
    select: SelectCtor | undefined = undefined
    where: WhereCtor | undefined = undefined

    constructor(
        select?: SelectCtor,
        where?: WhereCtor,
    ) {
        this.select = select, this.where = where
    }

    build(): [string, SupportedValueType] {
        const ctx = new Context()
        const sql: string[] = []

        if (this.select) {
            sql.push(this.select().interpret(ctx))
        }

        if (this.where) {
            sql.push(this.where().interpret(ctx))
        }

        return [sql.join(' '), ctx.values]
    }
}
