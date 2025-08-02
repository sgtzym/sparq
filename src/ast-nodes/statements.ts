import type { ArrayLike } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { ParameterRegistry } from '~/core/parameter-registry.ts'
import { interpretAll, type Node } from '~/core/node.ts'

/** 🧬 AST nodes: Statements */

export class SelectNode implements Node {
    constructor(
        private readonly columns?: ArrayLike<Node>,
    ) {}

    interpret(params: ParameterRegistry): string {
        const columns: string =
            this.columns && (Array.isArray(this.columns) && this.columns.length)
                ? sql.comma(...interpretAll(this.columns, params))
                : SQL_SYMBOLS.ALL

        return `${SQL.SELECT} ${columns}`
    }
}

export class UpdateNode implements Node {
    constructor(
        private readonly table: Node,
    ) {}

    interpret(params: ParameterRegistry): string {
        return `${SQL.UPDATE} ${this.table.interpret(params)}`
    }
}

export class InsertNode implements Node {
    constructor(
        private readonly table: Node,
        private readonly columns: ArrayLike<Node>,
    ) {}

    interpret(params: ParameterRegistry): string {
        return `${SQL.INSERT} ${SQL.INTO} ${this.table.interpret(params)} ${
            sql.group(sql.comma(...interpretAll(this.columns, params)))
        }`
    }
}

export class DeleteNode implements Node {
    interpret(_params: ParameterRegistry): string {
        return `${SQL.DELETE}`
    }
}
