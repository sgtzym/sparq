import type { NodeArg } from '~/core/node.ts'
import schemas, { type Schema } from '~/core/schema-registry.ts'
import { Column } from './column.ts'
import { Select } from '~/api/main.ts'

class Sparq<T extends Schema> {
    constructor(
        private readonly name: string,
        private readonly schema: T,
    ) {
        schemas.add(name, schema)
    }

    api() {
        // Populate col API
        const $ = {} as { [K in keyof T]: Column }

        for (const columnName in this.schema) {
            $[columnName] = new Column(columnName)
        }

        return {
            $, // Auto-complete for col names
            select: (...args: Array<NodeArg>) => new Select(this.name, args),
        }
    }
}

export const sparq = <T extends Schema>(name: string, schema: T) =>
    new Sparq(name, schema).api()
