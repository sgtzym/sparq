export type Table = Record<
    string,
    {
        type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NULL'
        nullable?: boolean
        primaryKey?: boolean
        unique?: boolean
        autoIncrement?: boolean
        default?:
            | string
            | number
            | boolean
            | null
            | 'CURRENT_TIMESTAMP'
            | 'CURRENT_DATE'
            | 'CURRENT_TIME'
    }
>

class TableReg {
    static #instance: TableReg
    static readonly #schemas: Map<string, Table> = new Map()

    private constructor() {}

    static get instance(): TableReg {
        if (!TableReg.#instance) {
            TableReg.#instance = new TableReg()
        }

        return TableReg.#instance
    }

    add(name: string, schema: Table) {
        TableReg.#schemas.set(name, schema)
    }

    get(name: string): Table | undefined {
        return TableReg.#schemas.get(name)
    }

    hasTable(table: string): boolean {
        return TableReg.#schemas.has(table)
    }

    hasColumn(columnName: string): boolean
    hasColumn(columnName: string, table: string): boolean
    hasColumn(columnName: string, table?: string): boolean {
        if (table) {
            const schema = TableReg.#schemas.get(table)
            return schema ? columnName in schema : false
        }

        for (const [_tableName, schema] of TableReg.#schemas) {
            if (columnName in schema) {
                return true
            }
        }
        return false
    }
}

export default TableReg.instance
