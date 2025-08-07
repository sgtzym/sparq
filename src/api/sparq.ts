import type { NodeArg } from '~/core/node.ts'
import { Column } from '~/api/column.ts'
import tables, { type Table } from '~/api/table.ts'
import { Delete, Insert, Select, Update } from '~/api/query-builder.ts'

// Columns API
type SparqColumns<T extends Table> =
    & {
        readonly [K in keyof T]: Column<T[K]>
    }
    & {
        /**
         * Selects all columns.
         * @returns A list of columns.
         */
        all(): Column<T[keyof T]>[]

        /**
         * Selects all except specific columns.
         * @param {} columns
         * @returns A filtered list of columns.
         */
        except(...columns: Column<T[keyof T]>[]): Column<T[keyof T]>[]

        /**
         * Returns all columns declared as primary key.
         * @returns A list of pk columns.
         */
        pk(): Column<T[keyof T]>[]
    }

// Table API
class SparqTable<T extends Table> {
    readonly #columns = {} as { [K in keyof T]: Column<T[K]> }
    readonly #columnList: Column<T[keyof T]>[] = []
    readonly #primaryKeys: Column<T[keyof T]>[] = []

    constructor(
        private readonly table: string,
        private readonly schema: T,
    ) {
        tables.add(table, schema)

        for (const colName in this.schema) {
            const column = new Column(
                colName as string,
                this.schema[colName].type,
            ) as Column<T[typeof colName]>

            this.#columns[colName] = column
            this.#columnList.push(column)

            if (this.schema[colName].primaryKey) {
                this.#primaryKeys.push(column)
            }
        }
    }

    /**
     * Exposes available columns and functions
     */
    get $(): SparqColumns<T> {
        return {
            ...this.#columns,

            all: () => [...this.#columnList],

            except: (...columns: Column<T[keyof T]>[]) => {
                const excludeSet = new Set(columns)
                return this.#columnList.filter((col) => !excludeSet.has(col))
            },

            pk: () => {
                if (this.#primaryKeys.length === 0) {
                    throw new Error(`Table '${this.table}' has no primary key`)
                }
                return [...this.#primaryKeys]
            },
        }
    }

    /**
     * Creates a SELECT query for retreiving data.
     * @param args Column expressions to select (defaults to * if empty)
     * @returns Chainable SELECT query builder
     */
    select(...args: Array<NodeArg>): Select {
        return new Select(this.table, args)
    }

    /**
     * Creates an INSERT query for adding new rows.
     * @param args Column assignments for the new row
     * @returns Chainable INSERT query builder
     */
    insert(...args: Array<NodeArg>): Insert {
        return new Insert(this.table, args)
    }

    /**
     * Creates an UPDATE query for modifying existing rows.
     * @param args Column assignments to update
     * @returns Chainable UPDATE query builder
     */
    update(...args: Array<NodeArg>): Update {
        return new Update(this.table, args)
    }

    /**
     * Creates a DELETE query for removing rows.
     * @param args
     * @returns Chainable DELETE query builder
     */
    delete(): Delete {
        return new Delete(this.table)
    }
}

type Sparq<T extends Table> = SparqTable<T> & SparqColumns<T>

/**
 * Public entry point
 * @param name
 * @param schema
 * @returns
 */
export const sparq = <T extends Table>(name: string, schema: T): Sparq<T> => {
    const table: SparqTable<T> = new SparqTable(name, schema)

    return new Proxy(table, {
        get(target, prop) {
            // Check if prop/func of SparqTable
            if (prop in target) {
                return target[prop as keyof typeof target]
            }

            // Check if col
            const columns = target.$
            if (prop in columns) {
                return columns[prop as keyof typeof columns]
            }

            return undefined
        },
    }) as Sparq<T>
}
