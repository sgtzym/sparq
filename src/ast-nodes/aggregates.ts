import { SQL_KEYWORDS as SQL } from '~/core/sql-constants.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import type { Node } from '~/core/node.ts'

export const AGGREGATE_FUNCTIONS = {
    AVG: SQL.AVG,
    COUNT: SQL.COUNT,
    MAX: SQL.MAX,
    MIN: SQL.MIN,
    SUM: SQL.SUM,
} as const

export type AggregateFunction = typeof AGGREGATE_FUNCTIONS[keyof typeof AGGREGATE_FUNCTIONS]

export class AggregateNode implements Node {
    constructor(
        private readonly fn: AggregateFunction,
        private readonly expression: Node,
    ) {}

    interpret(params: Parameters): string {
        return `${this.fn}(${this.expression.interpret(params)})`
    }
}
