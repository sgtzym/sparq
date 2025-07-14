import type { Node, NodeContext } from '../core/node.ts'

interface AggregateOptions {
    distinct?: boolean
}

export class CountNode implements Node {
    constructor(
        private readonly column?: Node,
        private readonly options: AggregateOptions = {},
    ) {}

    interpret(ctx: NodeContext): string {
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

    interpret(ctx: NodeContext): string {
        const mod = this.options.distinct ? 'DISTINCT ' : ''
        return `SUM(${mod}${this.column.interpret(ctx)})`
    }
}
