import type { SqlNodeValue, SqlParam } from '~/core/sql-node.ts'
import {
    BooleanColumn,
    type Column,
    DateTimeColumn,
    type IBooleanColumn,
    type IColumn,
    type IDateTimeColumn,
    type IJsonColumn,
    type INumberColumn,
    type ITextColumn,
    JsonColumn,
    NumberColumn,
    TextColumn,
} from '~/api/column.ts'
import { Delete, Insert, Select, Update } from '~/api/query-builders.ts'

type TableSchema = Record<string, SqlParam>

type ColumnTypeMapping<K extends string, T extends SqlParam> = T extends number
    ? INumberColumn<K>
    : T extends string ? ITextColumn<K>
    : T extends Date ? IDateTimeColumn<K>
    : T extends boolean ? IBooleanColumn<K>
    : T extends Record<string, any> ? IJsonColumn<K>
    : T extends Uint8Array ? IColumn<K, T>
    : T extends null ? IColumn<K, T>
    : IColumn<K, T>

type ColumnsProxy<T extends TableSchema> = {
    [K in keyof T]: ColumnTypeMapping<K & string, T[K]>
}

/**
 * Type-safe query builder for SQLite tables.
 * Provides schema-aware column access and query operations.
 */
export class Sparq<T extends TableSchema> {
    public readonly table: string
    private readonly columns: ColumnsProxy<T>

    constructor(
        table: string,
        schema: T,
    ) {
        this.table = table
        this.columns = {} as ColumnsProxy<T>

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
                column = new JsonColumn(name, table)
            }

            ;(this.columns as any)[name] = column
        }
    }

    /** Accesses typed table columns. */
    get $(): ColumnsProxy<T> {
        return this.columns
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
            typeof col === 'string' && col in this.columns
                ? this.columns[col as keyof T]
                : col
        )
        return new Insert(this.table, cols as SqlNodeValue[])
    }

    /** Modifies existing records. */
    update(assignments: Partial<T> | SqlNodeValue[]): Update {
        const assigns = Array.isArray(assignments)
            ? assignments
            : Object.entries(assignments).map(([col, val]) =>
                this.columns[col as keyof T].to(val)
            )
        return new Update(this.table, assigns)
    }

    /** Removes records. */
    delete(): Delete {
        return new Delete(this.table)
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
export function sparq<T extends TableSchema>(
    tableName: string,
    schema: T,
): Sparq<T> {
    return new Sparq(tableName, schema)
}
