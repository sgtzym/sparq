import type { NodeArg } from '~/core/node.ts'
import schemas, { type Schema } from '~/core/schema-registry.ts'
import { Column } from '~/api/column.ts'
import { Delete, Insert, Select, Update } from '~/api/query-builder.ts'

type SparqColumns<T extends Schema> = {
    readonly [K in keyof T]: Column<T[K]>
}

class SparqTable<T extends Schema> {
    readonly #columns: SparqColumns<T>

    constructor(
        private readonly table: string,
        private readonly schema: T,
    ) {
        schemas.add(table, schema)

        const cols: { [K in keyof T]?: Column<T[K]> } = {}

        for (const colName in this.schema) {
            const colDef = this.schema[colName]
            cols[colName] = new Column(
                colName as string,
                colDef.type,
            ) as Column<T[typeof colName]>
        }

        this.#columns = cols as SparqColumns<T>
    }

    /**
     * Exposes available columns
     */
    get $(): SparqColumns<T> {
        return this.#columns
    }

    /**
     * Creates a SELECT query for retreiving data
     * @param args Column expressions to select (defaults to * if empty)
     * @returns Chainable SELECT query builder
     * 
     * @example
     * user.sel
     */
    select(...args: Array<NodeArg>): Select {
        return new Select(this.table, args)
    }

    /**
     * Creates an INSERT query for adding new rows
     * @param args Column assignments for the new row
     * @returns Chainable INSERT query builder
     */
    insert(...args: Array<NodeArg>): Insert {
        return new Insert(this.table, args)
    }

    /**
     * Creates an UPDATE query for modifying existing rows
     * @param args Column assignments to update
     * @returns Chainable UPDATE query builder
     * 
     * @example
     * user.update(
     *     user.score.set(100)
     *     user.score.set(user.score.add(1))
     * )
    */
    update(...args: Array<NodeArg>): Update {
        return new Update(this.table, args)
    }

    /**
     * Creates a DELETE query for removing rows
     * @param args
     * @returns Chainable DELETE query builder
     */
    delete(): Delete {
        return new Delete(this.table)
    }
}

type Sparq<T extends Schema> = SparqTable<T> & SparqColumns<T>

/**
 * Public entry point
 * @param name
 * @param schema
 * @returns
 */
export const sparq = <T extends Schema>(name: string, schema: T): Sparq<T> => {
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
