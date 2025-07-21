import {
    needsQuoting,
    type SqlIdentifier,
    type SqlValue,
    toSqlValue,
} from '@/core/sql-types.ts'
import type { Node } from '@/core/node.ts'
import type { Context } from '@/core/context.ts'

// ---

export class RawNode implements Node {
    constructor(private readonly value: string) {}

    interpret(_ctx: Context): string {
        return String(this.value)
    }
}

// ---

export class LiteralNode implements Node {
    constructor(private readonly value: SqlValue) {}

    interpret(ctx: Context): string {
        ctx.set(toSqlValue(this.value))

        return `:${ctx.current}`
    }
}

// ---

export class IdentifierNode implements Node {
    constructor(private readonly name: SqlIdentifier) {}

    interpret(_ctx: Context): string {
        const parts: string[] = this.name.split('.')
        const qualifiedName: string = parts.map((p) =>
            needsQuoting(p) ? `"${p}"` : p
        ).join('.')
        return qualifiedName
    }
}
