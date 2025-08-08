import type { NodeArg, Param } from '~/core/node.ts'
import { Column } from '~/api/column.ts'

import { Delete, Insert, Select, Update } from './stmt-builder.ts'

// Columns API
// type SparqColumns<T extends Table> =
//     & {
//         readonly [K in keyof T]: Column<T[K]>
//     }
//     & {
//         /**
//          * Selects all columns from the corresponding table.
//          * @returns A list of all columns
//          */
//         all(): Column<T[keyof T]>[]

//         /**
//          * Selects all except specific columns from the corresponding table.
//          * @param {} columns - Columns to filter out
//          * @returns A filtered list of columns
//          */
//         except(...columns: Column<T[keyof T]>[]): Column<T[keyof T]>[]

//         /**
//          * Returns all columns declared as primary key (pk).
//          * @returns A list of pk columns
//          */
//         pk(): Column<T[keyof T]>[]
//     }

// Table API
// class SparqTable<T extends Table> {
//     readonly #columns = {} as { [K in keyof T]: Column<T[K]> }
//     readonly #columnList: Column<T[keyof T]>[] = []
//     readonly #primaryKeys: Column<T[keyof T]>[] = []

//     constructor(
//         private readonly table: string,
//         private readonly schema: T,
//     ) {
//         tables.add(table, schema)

//         for (const colName in this.schema) {
//             const column = new Column(
//                 colName as string,
//                 this.schema[colName].type,
//             ) as Column<T[typeof colName]>

//             this.#columns[colName] = column
//             this.#columnList.push(column)

//             if (this.schema[colName].primaryKey) {
//                 this.#primaryKeys.push(column)
//             }
//         }
//     }

//     /**
//      * Exposes available columns and functions
//      */
//     get $(): SparqColumns<T> {
//         return {
//             ...this.#columns,

//             all: () => [...this.#columnList],

//             except: (...columns: Column<T[keyof T]>[]) => {
//                 const excludeSet = new Set(columns)
//                 return this.#columnList.filter((col) => !excludeSet.has(col))
//             },

//             pk: () => {
//                 if (this.#primaryKeys.length === 0) {
//                     throw new Error(`Table '${this.table}' has no primary key`)
//                 }
//                 return [...this.#primaryKeys]
//             },
//         }
//     }

//     /**
//      * Creates a SELECT statement for retreiving data.
//      * @param args - Column expressions to select (defaults to * if empty)
//      */
//     select(...args: Array<NodeArg>): Select {
//         return new Select(this.table, args)
//     }

//     /**
//      * Creates an INSERT statement for adding new rows.
//      * @param args - Column assignments for the new row
//      */
//     insert(...args: Array<NodeArg>): Insert {
//         return new Insert(this.table, args)
//     }

//     /**
//      * Creates an UPDATE statement for modifying existing rows.
//      * @param args - Column assignments to update
//      */
//     update(...args: Array<NodeArg>): Update {
//         return new Update(this.table, args)
//     }

//     /**
//      * Creates a DELETE statement for removing rows.
//      */
//     delete(): Delete {
//         return new Delete(this.table)
//     }
// }

// type Sparq<T extends Table> = SparqTable<T> & SparqColumns<T>

// /**
//  * SPARQ's API entry point.
//  * @param name - The name of the table to perform operations on
//  * @param schema - A predefined table schema for type-safety
//  * @returns A reusable, schema-aware API
//  */
// export const sparq = <T extends Table>(name: string, schema: T): Sparq<T> => {
//     const table: SparqTable<T> = new SparqTable(name, schema)

//     return new Proxy(table, {
//         get(target, prop) {
//             // Check if prop/func of SparqTable
//             if (prop in target) {
//                 return target[prop as keyof typeof target]
//             }

//             // Check if col
//             const columns = target.$
//             if (prop in columns) {
//                 return columns[prop as keyof typeof columns]
//             }

//             return undefined
//         },
//     }) as Sparq<T>
// }

type TableSchema = Record<string, Param>

type ColumnsProxy<T extends TableSchema> = {
    [K in keyof T]: Column<K & string, T[K]>
}

class Sparq<T extends TableSchema> {
    private readonly columns: ColumnsProxy<T>

    constructor(
        private readonly tableName: string,
        schema: T,
    ) {
        // Create columns dynamically from schema
        this.columns = {} as ColumnsProxy<T>

        for (const name of Object.keys(schema)) {
            ;(this.columns as any)[name] = new Column(name)
        }
    }

    // Provides direct access to columns via $
    get $(): ColumnsProxy<T> {
        return this.columns
    }
}

export function sparq<T extends TableSchema>(
    tableName: string,
    schema: T,
): Sparq<T> {
    return new Sparq(tableName, schema)
}
