import type { NodeArg } from '~/core/node.ts'
import schemas, { type Schema } from '~/core/schema-registry.ts'
import { Column } from './column.ts'
import { Delete, Insert, Select, Update } from './query-builder.ts'

type ColumnProperties<T extends Schema> = {
    readonly [K in keyof T]: Column<T, K>
}

class SparqApi<T extends Schema> {
    constructor(
        private readonly name: string,
        private readonly schema: T,
    ) {
        schemas.add(name, schema)

        // Add props at runtime (bin to this)
        for (const columnName in this.schema) {
            ;(this as any)[columnName] = new Column(columnName, schema)
        }
    }

    get $(): ColumnProperties<T> {
        const cols = {} as {
            [K in keyof T]: Column<T, K>
        }

        for (const columnName in this.schema) {
            cols[columnName] = (this as any)[columnName]
        }

        return cols
    }

    select(...args: Array<NodeArg>) {
        return new Select(this.name, args)
    }

    insert(...args: Array<NodeArg>) {
        return new Insert(this.name, args)
    }

    update(...args: Array<NodeArg>) {
        return new Update(this.name, args)
    }

    delete() {
        return new Delete(this.name)
    }
}

// Intersection: SparqBase + ColumnProperties
type Sparq<T extends Schema> = SparqApi<T> & ColumnProperties<T>

// Factory function with proper typing
export const sparq = <T extends Schema>(name: string, schema: T): Sparq<T> => {
    return new SparqApi(name, schema) as Sparq<T>
}
