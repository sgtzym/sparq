import type { SqlNodeValue, SqlParam } from '~/core/sql-node.ts'
import {
    BooleanColumn,
    type Column,
    DateTimeColumn,
    JsonColumn,
    NumberColumn,
    TextColumn,
} from '~/api/column.ts'
import { Delete, Insert, Select, Update } from '~/api/query-builders.ts'

type TableSchema = Record<string, SqlParam>

type ColumnTypeMapping<K extends string, T extends SqlParam> = T extends number
    ? NumberColumn<K>
    : T extends string ? TextColumn<K>
    : T extends Date ? DateTimeColumn<K>
    : T extends boolean ? BooleanColumn<K>
    : T extends Record<string, any> ? JsonColumn<K>
    : T extends Uint8Array ? Column<K, T>
    : T extends null ? Column<K, T>
    : Column<K, T>

type ColumnsProxy<T extends TableSchema> = {
    [K in keyof T]: ColumnTypeMapping<K & string, T[K]>
}

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

    // Provides direct access to columns via $
    get $(): ColumnsProxy<T> {
        return this.columns
    }

    /**
     * Creates a SELECT query for this table.
     * @param columns - Columns to select (defaults to * if empty)
     */
    select(...columns: SqlNodeValue[]): Select {
        return new Select(this.table, columns)
    }

    /**
     * Creates an INSERT query for this table.
     * @param columns - Columns to insert values into
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
     * Creates an UPDATE query for this table.
     * @param assignments - Column assignments (can be object or array of nodes)
     */
    update(assignments: Partial<T> | SqlNodeValue[]): Update {
        const assigns = Array.isArray(assignments)
            ? assignments
            : Object.entries(assignments).map(([col, val]) =>
                this.columns[col as keyof T].set(val)
            )
        return new Update(this.table, assigns)
    }

    /**
     * Creates a DELETE query for this table.
     */
    delete(): Delete {
        return new Delete(this.table)
    }
}

/**
 * Creates a reusable, schema-aware query builder.
 * @param tableName - The name of the target table
 * @param schema - The target table's schema
 * @returns The query builder
 */
export function sparq<T extends TableSchema>(
    tableName: string,
    schema: T,
): Sparq<T> {
    return new Sparq(tableName, schema)
}
