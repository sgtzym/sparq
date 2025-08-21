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
 * Schema-aware query builder for a specific table.
 * Provides type-safe access to table columns and query operations.
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

    /**
     * Access table columns with `$`.
     *
     * @example
     * ```ts
     * const users = sparq(...)
     *
     * users.$.id // users.id
     * ```
     */
    get $(): ColumnsProxy<T> {
        return this.columns
    }

    /**
     * Creates a SELECT statement with optional column specification.
     * Use this to retrieve data from tables with specific columns or all columns.
     *
     * @param columns - The columns to select (defaults to * if empty)
     *
     * @example
     * ```ts
     * users.select() // SELECT * FROM users
     * ```
     */
    select(...columns: SqlNodeValue[]): Select {
        return new Select(this.table, columns)
    }

    /**
     * Creates an INSERT statement with table and column specification.
     * Use this to add new records to a table with specified columns.
     *
     * @example
     * ```ts
     * // Insert rows into orders
     * orders
     *   .insert(order.id, order.total, order.status)
     *   .values(34987, 3, 'pending')
     *   .values(33001, 1, 'paid')
     * ```
     */
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

    /**
     * Creates an UPDATE statement for the specified table.
     * Use this as the starting point for modifying existing records.
     *
     * @example
     * ```ts
     * // UPDATE users SET score = 0
     * users.update(user.score.to(0))
     * ```
     */
    update(assignments: Partial<T> | SqlNodeValue[]): Update {
        const assigns = Array.isArray(assignments)
            ? assignments
            : Object.entries(assignments).map(([col, val]) =>
                this.columns[col as keyof T].to(val)
            )
        return new Update(this.table, assigns)
    }

    /**
     * Creates a DELETE statement.
     * Use this as the starting point for removing records from tables.
     *
     * @example
     * ```ts
     * users.delete() // DELETE * FROM users
     * ```
     */
    delete(): Delete {
        return new Delete(this.table)
    }
}

/**
 * Entry-point for schema-aware table operations.
 * Creates a table-specific API object that can be reused to query/change data.
 */
export function sparq<T extends TableSchema>(
    tableName: string,
    schema: T,
): Sparq<T> {
    return new Sparq(tableName, schema)
}
