// deno-fmt-ignore-file
import type { NodeArg } from '~/core/node.ts'

import {
    DeleteBuilder,
    InsertBuilder,
    SelectBuilder,
    UpdateBuilder
} from '~/api/builders.ts'

/**
 * Basic query builder 🧑‍🏭
 */
class Sparq {
    constructor(private readonly table: string) {}

    select(): SelectBuilder
    select(...fields: NodeArg[]): SelectBuilder
    select(fields?: any): SelectBuilder {
        return new SelectBuilder(this.table, fields)
    }

    // Auto-detects required columns from given data (rows).
    insert(...rows: Record<string, NodeArg>[]): InsertBuilder {
        const parsedFields = Object.keys(rows[0])
        const parsedValues = Object.entries(rows).map((r) => Object.values(r) as NodeArg[])

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

/**
 * Public query entry point.
 * Provides a fluent API for SQL operations.
 *
 * @param {string} table - Table name
 * @returns {Sparq} Table-scoped query builder
 *
 * @example
 * ```typescript
 * const [sql, params] = sparq('users')
 *   .select('id', 'name', 'age')
 *   .where(eq('status', 'active'))
 *   .build()
 * ```
 */
export const sparq = (table: string): Sparq => new Sparq(table)