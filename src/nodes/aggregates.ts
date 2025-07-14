import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

interface AggregateOptions {
    distinct?: boolean
}

export class CountNode implements Node {
    constructor(
        private readonly column?: Node,
        private readonly options: AggregateOptions = {},
    ) {}

    interpret(ctx: Context): string {
        if (!this.column) {
            return 'COUNT(1)'
        }
        const mod = this.options.distinct ? 'DISTINCT ' : ''
        return `COUNT(${mod}${this.column.interpret(ctx)})`
    }
}

export class SumNode implements Node {
    constructor(
        private readonly column: Node,
        private readonly options: AggregateOptions = {},
    ) {}

    interpret(ctx: Context): string {
        const mod = this.options.distinct ? 'DISTINCT ' : ''
        return `SUM(${mod}${this.column.interpret(ctx)})`
    }
}
