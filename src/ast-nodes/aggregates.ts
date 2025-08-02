import { SQL_KEYWORDS as SQL, SQL_SYMBOLS } from '~/core/sql-constants.ts'
import type { ParameterRegistry } from '~/core/parameter-registry.ts'
import type { Node } from '~/core/node.ts'

/** AST nodes representing SQL aggregate functions 🧬 */

export const AGGREGATE_FUNCTIONS = {
    AVG: SQL.AVG,
    COUNT: SQL.COUNT,
    MAX: SQL.MAX,
    MIN: SQL.MIN,
    SUM: SQL.SUM,
} as const

export type AggregateFunction =
    typeof AGGREGATE_FUNCTIONS[keyof typeof AGGREGATE_FUNCTIONS]

export class AggregateNode implements Node {
    constructor(
        private readonly fn: AggregateFunction,
        private readonly expr?: Node,
    ) {}

    interpret(params: ParameterRegistry): string {
        return this.expr
            ? `${this.fn}(${this.expr.interpret(params)})`
            : `${this.fn}(${SQL_SYMBOLS.ALL})`
    }
}
