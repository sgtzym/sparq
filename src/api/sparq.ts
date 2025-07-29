import type { NodeArg } from '~/core/node.ts'
import { DeleteBuilder, InsertBuilder, SelectBuilder, UpdateBuilder } from '~/api/builders.ts'

class Sparq {
    constructor(private readonly table: string) {}

    select(): SelectBuilder
    select(...fields: NodeArg[]): SelectBuilder
    select(fields?: any): SelectBuilder {
        return new SelectBuilder(this.table, fields)
    }

    insert(...records: Record<string, NodeArg>[]): InsertBuilder {
        const parsedFields = Object.keys(records[0])
        const parsedValues = Object.entries(records).map((r) => Object.values(r) as NodeArg[])

        return new InsertBuilder(this.table, parsedFields, parsedValues)
    }

    update(assignments: Record<string, NodeArg>): UpdateBuilder {
        const parsedAssignments = Object.entries(assignments).map((a) => a as [NodeArg, NodeArg])

        return new UpdateBuilder(this.table, parsedAssignments)
    }

    delete(): DeleteBuilder {
        return new DeleteBuilder(this.table)
    }
}

export const sparq = (table: string) => new Sparq(table)
