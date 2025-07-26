import type { ArrayLike } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { interpretAll, type Node } from '~/core/node.ts'

export class SelectNode implements Node {
    constructor(private readonly fields?: ArrayLike<Node>) {}

    interpret(params: Parameters): string {
        return (this.fields && Array.isArray(this.fields) && this.fields.length)
            ? `${SQL.SELECT} ${sql.comma(...interpretAll(this.fields, params))}`
            : `${SQL.SELECT} ${SQL_SYMBOLS.ALL}`
    }
}

export class UpdateNode implements Node {
    constructor(private readonly table: Node) {}

    interpret(params: Parameters): string {
        return `${SQL.UPDATE} ${this.table.interpret(params)}`
    }
}

export class InsertNode implements Node {
    constructor(private readonly table: Node) {}

    interpret(params: Parameters): string {
        return `${SQL.INSERT} ${SQL.INTO} ${this.table.interpret(params)}`
    }
}

export class DeleteNode implements Node {
    interpret(): string {
        return SQL.DELETE
    }
}
