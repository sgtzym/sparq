import type { Context } from '@/core/context.ts'
import type { Node } from '@/core/node.ts'

export class DistinctModNode implements Node {
    constructor(
        private readonly distinct: boolean = true,
    ) {}

    interpret(_ctx: Context): string {
        return `${this.distinct ? 'DISTINCT' : 'ALL'}`
    }
}
