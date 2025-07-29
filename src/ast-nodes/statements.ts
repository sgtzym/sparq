import type { ArrayLike } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { interpretAll, type Node } from '~/core/node.ts'

/** */
export class SelectNode implements Node {
    constructor(
        private readonly fields?: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const sqlFields: string = this.fields && (Array.isArray(this.fields) && this.fields.length)
            ? sql.comma(...interpretAll(this.fields, params))
            : SQL_SYMBOLS.ALL

        return `${SQL.SELECT} ${sqlFields}`
    }
}

/** */
export class UpdateNode implements Node {
    constructor(
        private readonly table: Node,
    ) {}

    interpret(params: Parameters): string {
        return `${SQL.UPDATE} ${this.table.interpret(params)}`
    }
}

/** */
export class InsertNode implements Node {
    constructor(
        private readonly table: Node,
        private readonly fields: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        return `${SQL.INSERT} ${SQL.INTO} ${this.table.interpret(params)} ${
            sql.parens(sql.comma(...interpretAll(this.fields, params)))
        }`
    }
}

/** */
export class DeleteNode implements Node {
    interpret(_params: Parameters): string {
        return `${SQL.DELETE}`
    }
}
