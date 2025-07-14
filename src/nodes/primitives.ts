import { castSupportedValueType } from '../core/utils.ts'
import type { Node, Context } from '../core/node.ts'

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

        if (typeof value === 'string') {
            value = `'${value.replace(/'/g, "''")}'`
        }

        ctx.set(value)

        return `:${ctx.current}`
    }
}

// ---

export class IdentifierNode implements Node {
    constructor(
        private readonly name: string,
        private readonly alias?: string,
    ) {}

    interpret(_ctx: Context): string {
        return this.alias
            ? `"${this.name}" AS "${this.alias}"`
            : `"${this.name}"`
    }
}
