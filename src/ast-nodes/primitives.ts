import { sql } from '~/core/sql.ts'
import type { ParameterRegistry } from '~/core/parameter-registry.ts'
import type { Node, NodeValue } from '~/core/node.ts'

/** AST nodes representing SQL primitives 🧬 */

export class RawNode implements Node {
    constructor(private readonly sql: string) {}

    interpret(_params: ParameterRegistry): string {
        return this.sql
    }
}

export class LiteralNode implements Node {
    constructor(private readonly value: NodeValue) {}

    interpret(params: ParameterRegistry): string {
        return params.add(sql.toSqlValue(this.value))
    }
}

export class IdentifierNode implements Node {
    constructor(private readonly name: string) {}

    interpret(_params: ParameterRegistry): string {
        const parts = this.name.split('.')
        return parts
            .map((part) => sql.needsQuoting(part) ? `"${part}"` : part)
            .join('.')
    }
}
