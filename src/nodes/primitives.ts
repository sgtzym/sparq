import {
    needsQuoting,
    type SqlIdentifier,
    type SqlValue,
    toSqlValue,
} from '~/core/sql-types.ts'
import type { Node, NodeContext } from '~/core/node.ts'

// ---

export class RawNode implements Node {
    constructor(private readonly value: string) {}

    interpret(_ctx: NodeContext): string {
        return String(this.value)
    }
}

// ---

export class LiteralNode implements Node {
    constructor(private readonly value: SqlValue) {}

    interpret(ctx: NodeContext): string {
        ctx.set(toSqlValue(this.value))

        return `:${ctx.current}`
    }
}

// ---

export class IdentifierNode implements Node {
    constructor(private readonly name: SqlIdentifier) {}

    interpret(_ctx: NodeContext): string {
        const parts: string[] = this.name.split('.')
        const qualifiedName: string = parts.map((p) =>
            needsQuoting(p) ? `"${p}"` : p
        ).join('.')
        return qualifiedName
    }
}
