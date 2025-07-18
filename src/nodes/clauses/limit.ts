import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export class LimitNode implements Node {
    constructor(
        private readonly count: number,
        private readonly offset?: number,
    ) {}

    interpret(_ctx: Context): string {
        if (!Number.isInteger(this.count) || this.count < 0) {
            throw new Error(`Invalid LIMIT value: ${this.count}`)
        }

        if (
            this.offset !== undefined &&
            (!Number.isInteger(this.offset) || this.offset < 0)
        ) {
            throw new Error(`Invalid OFFSET value: ${this.offset}`)
        }

        const parts = [`LIMIT ${this.count}`]

        if (this.offset !== undefined) {
            parts.push(`OFFSET ${this.offset}`)
        }

        return parts.join(' ')
    }
}
