import type { NodeExpr } from '~/core/node.ts'
import schemas, { type Schema } from '~/core/schema-registry.ts'
import {
    DeleteBuilder,
    InsertBuilder,
    SelectBuilder,
    UpdateBuilder,
} from './query-builders.ts'

/**
 * Public query entry point.
 * Provides fluent APIs for SQL operations.
 */
class Sparq {
    define<T extends Schema>(name: string, schema: T) {
        schemas.add(name, schema)
        return this.#api(name, schema)
    }

    #api<T extends Schema>(table: string, _schema: T) {
        function _select(...args: (keyof T)[]): SelectBuilder
        function _select(...args: NodeExpr[]): SelectBuilder
        function _select(...args: (keyof T | NodeExpr)[]): SelectBuilder {
            return new SelectBuilder(table, args as NodeExpr[])
        }

        function _insert(
            ...rows: Partial<Record<keyof T, unknown>>[]
        ): InsertBuilder {
            const parsedFields = Object.keys(rows[0] || {})
            const parsedValues = rows.map((row) => Object.values(row))
            return new InsertBuilder(
                table,
                parsedFields,
                parsedValues as NodeExpr[][],
            )
        }

        function _update(
            data: Partial<Record<keyof T, unknown>>,
        ): UpdateBuilder {
            const assignments = Object.entries(data).map((a) => a as [string, NodeExpr])
            return new UpdateBuilder(table, assignments)
        }

        function _delete(): DeleteBuilder {
            return new DeleteBuilder(table)
        }

        return {
            select: _select,
            insert: _insert,
            update: _update,
            delete: _delete,
        }
    }
}

export const sparq: Sparq = new Sparq()
