import { sql } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import type { Node, NodeValue } from '~/core/node.ts'

/** AST nodes representing SQL primitives 🧬 */

export class RawNode implements Node {
    constructor(private readonly sql: string) {}

    interpret(_params: Parameters): string {
        return this.sql
    }
}

export class LiteralNode implements Node {
    constructor(private readonly value: NodeValue) {}

    interpret(params: Parameters): string {
        return params.add(sql.toSqlValue(this.value))
    }
}

export class IdentifierNode implements Node {
    constructor(private readonly name: string) {}

    interpret(_params: Parameters): string {
        const parts = this.name.split('.')
        return parts
            .map((part) => sql.needsQuoting(part) ? `"${part}"` : part)
            .join('.')
    }
}
