import type { NodeArg } from '~/core/node.ts'
import schemas, { type Schema } from '~/core/schema-registry.ts'
import { DeleteBuilder, InsertBuilder, SelectBuilder, UpdateBuilder } from './query-builders.ts'

/**
 * Basic query builder 🧑‍🏭
 */
class Sparq {
    define<T extends Schema>(name: string, schema: T) {
        schemas.add(name, schema)
        return this.#api(name, schema)
    }

    #api<T extends Schema>(name: string, _schema: T) {
        function select(...columns: (keyof T)[]): SelectBuilder
        function select(...expressions: NodeArg[]): SelectBuilder
        function select(...args: (keyof T | NodeArg)[]): SelectBuilder {
            return new SelectBuilder(name, args as NodeArg[])
        }

        return {
            select,

            insert(...rows: Partial<Record<keyof T, unknown>>[]): InsertBuilder {
                const parsedFields = Object.keys(rows[0] || {})
                const parsedValues = rows.map((row) => Object.values(row))
                return new InsertBuilder(name, parsedFields, parsedValues as NodeArg[][])
            },

            update(data: Partial<Record<keyof T, unknown>>): UpdateBuilder {
                const assignments = Object.entries(data).map((a) => a as [any, any])
                return new UpdateBuilder(name, assignments)
            },

            delete(): DeleteBuilder {
                return new DeleteBuilder(name)
            },
        }
    }
}

/**
 * Public query entry point.
 * Provides a fluent API for SQL operations.
 */
export const sparq: Sparq = new Sparq()
