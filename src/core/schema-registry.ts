export type Schema = Record<string, {
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
}>

class SchemaRegistry {
    static #instance: SchemaRegistry
    static readonly #schemas: Map<string, Schema> = new Map()

    private constructor() {}

    static get instance(): SchemaRegistry {
        if (!SchemaRegistry.#instance) {
            SchemaRegistry.#instance = new SchemaRegistry()
        }

        return SchemaRegistry.#instance
    }

    add(name: string, schema: Schema) {
        SchemaRegistry.#schemas.set(name, schema)
    }

    get(name: string): Schema | undefined {
        return SchemaRegistry.#schemas.get(name)
    }

    hasTable(tableName: string): boolean {
        return SchemaRegistry.#schemas.has(tableName)
    }

    hasColumn(columnName: string): boolean
    hasColumn(columnName: string, tableName: string): boolean
    hasColumn(columnName: string, tableName?: string): boolean {
        if (tableName) {
            const schema = SchemaRegistry.#schemas.get(tableName)
            return schema ? columnName in schema : false
        }

        for (const [_tableName, schema] of SchemaRegistry.#schemas) {
            if (columnName in schema) {
                return true
            }
        }
        return false
    }
}

export default SchemaRegistry.instance
