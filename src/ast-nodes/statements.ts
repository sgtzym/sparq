import type { ArrayLike } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { interpretAll, type Node } from '~/core/node.ts'

/** AST nodes representing SQL statements 🧬 */

export class SelectNode implements Node {
    constructor(
        private readonly columns?: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const columns: string = this.columns && (Array.isArray(this.columns) && this.columns.length)
            ? sql.comma(...interpretAll(this.columns, params))
            : SQL_SYMBOLS.ALL

        return `${SQL.SELECT} ${columns}`
    }
}

export class UpdateNode implements Node {
    constructor(
        private readonly table: Node,
    ) {}

    interpret(params: Parameters): string {
        return `${SQL.UPDATE} ${this.table.interpret(params)}`
    }
}

export class InsertNode implements Node {
    constructor(
        private readonly table: Node,
        private readonly columns: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        return `${SQL.INSERT} ${SQL.INTO} ${this.table.interpret(params)} ${
            sql.group(sql.comma(...interpretAll(this.columns, params)))
        }`
    }
}

export class DeleteNode implements Node {
    interpret(_params: Parameters): string {
        return `${SQL.DELETE}`
    }
}
