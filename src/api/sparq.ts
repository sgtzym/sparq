import schemas, { type Schema } from '~/core/schema-registry.ts'
import { Column } from './column.ts'
import type { NodeArg } from '../core/node.ts'
import { SelectApi } from './query.ts'

class Sparq {
    $(strings: TemplateStringsArray): Column {
        return new Column(strings[0])
    }

    define<T extends Schema>(name: string, schema: T) {
        schemas.add(name, schema)
        return this.#api(name, schema)
    }

    #api<T extends Schema>(table: string, _schema: T) {
        function _select(...args: (keyof T)[]): SelectApi
        function _select(...args: NodeArg[]): SelectApi
        function _select(...args: (keyof T | NodeArg)[]): SelectApi {
            return new SelectApi(table, args as NodeArg[])
        }

        return {
            select: _select,
        }
    }
}

export const sparq: Sparq = new Sparq()
