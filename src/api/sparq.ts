import type { SqlNodeValue, SqlParam } from '~/core/sql-node.ts'
import { Column, type ColumnTypeMapping, NumberColumn } from '~/api/column.ts'
import { Delete, Insert, Select, Update } from '~/api/query-builders.ts'
import { BooleanColumn, DateTimeColumn, TextColumn } from '~/api/column.ts'

/**
 * Type-safe query builder for SQLite tables.
 * Provides schema-aware column access and query operations.
 */
export class Sparq<T extends Record<string, any>> {
    public readonly table: string
    private readonly _$: { [P in keyof T]: ColumnTypeMapping<string & P, T[P]> }

    constructor(table: string, schema: T) {
        this.table = table
        this._$ = {} as any

        // Instanciate columns based on schema
        for (const [name, value] of Object.entries(schema)) {
            let column: Column<string, SqlParam>

            if (typeof value === 'number') {
                column = new NumberColumn(name, table)
            } else if (typeof value === 'string') {
                column = new TextColumn(name, table)
            } else if (value instanceof Date) {
                column = new DateTimeColumn(name, table)
            } else if (typeof value === 'boolean') {
                column = new BooleanColumn(name, table)
            } else {
                column = new Column(name, table)
            }

            ;(this._$ as any)[name] = column
        }
    }

    /** Retrieves data from table. */
    select(...columns: SqlNodeValue[]): Select {
        return new Select(this.table, columns)
    }

    /** Adds new records. */
    insert(
        ...columns: (keyof T | Column<string, SqlParam> | SqlNodeValue)[]
    ): Insert {
        const cols = columns.map((col) =>
            typeof col === 'string' && col in this.$ ? this.$[col as keyof T] : col
        )
        return new Insert(this.table, cols as SqlNodeValue[])
    }

    /** Modifies existing records. */
    update(assignments: Partial<T> | SqlNodeValue[]): Update {
        const assigns = Array.isArray(assignments)
            ? assignments
            : Object.entries(assignments).map(([col, val]) => this.$[col as keyof T].to(val))
        return new Update(this.table, assigns)
    }

    /** Removes records. */
    delete(): Delete {
        return new Delete(this.table)
    }

    get $(): { [P in keyof T]: ColumnTypeMapping<string & P, T[P]> } {
        return this._$
    }
}

/**
 * Creates a type-safe table query builder.
 *
 * @param tableName - Database table name
 * @param schema - Column definitions using SqlType
 * @returns Schema-aware query builder
 *
 * @example
 * ```ts
 * const users = sparq('users', {
 *   id: SqlType.number(),
 *   email: SqlType.text(),
 *   active: SqlType.boolean()
 * })
 *
 * users
 *   .select(users.$.email)
 *   .where(users.$.active.eq(true))
 * ```
 */
export function sparq<T extends Record<string, any>>(
    tableName: string,
    schema: T,
): Sparq<T> {
    return new Sparq(tableName, schema)
}
