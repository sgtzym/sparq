import { castSupportedValueType } from '@/core/utils.ts'
import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

// ---

export class RawNode implements Node {
    constructor(private readonly value: string) {}

    interpret(_ctx: Context): string {
        return this.value
    }
}

// ---

export class LiteralNode implements Node {
    constructor(private readonly value: unknown) {}

    interpret(ctx: Context): string {
        let value = castSupportedValueType(this.value)

        ctx.set(value)

        if (typeof value === 'string') {
            value = `'${value.replace(/'/g, "''")}'`
        }

        return `:${ctx.current}`
    }
}

// ---

export class IdentifierNode implements Node {
    constructor(private readonly name: string) {}
    interpret(_ctx: Context): string {
        const parts: string[] = this.name.split('.')
        const qualifiedName: string = parts.map((p) => this.escape(p)).join('.')

        return qualifiedName
    }

    private escape(part: string): string {
        return this.needsQuoting(part) ? `"${part}"` : part
    }

    private needsQuoting(name: string): boolean {
        return (
            name.includes('-') ||
            name.includes(' ') ||
            /^\d/.test(name) || // starts with a number
            /[^a-zA-Z0-9_]/.test(name) // contains special chars excl. underscores
        )
    }
}
