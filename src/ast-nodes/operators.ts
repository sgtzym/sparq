import { type ArrayLike, castArray } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS as SYMBOL } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { interpretAll, type Node } from '~/core/node.ts'

/** AST nodes representing logical/comparison expressions 🧬 */

export const LOGICAL_OPERATORS = {
    ALL: SQL.ALL,
    AND: SQL.AND,
    ANY: SQL.ANY,
    BETWEEN: SQL.BETWEEN,
    EXISTS: SQL.EXISTS,
    IN: SQL.IN,
    LIKE: SQL.LIKE,
    NOT: SQL.NOT,
    OR: SQL.OR,
} as const

export const COMPARISON_OPERATORS = {
    EQ: SYMBOL.EQ,
    NE: SYMBOL.NE,
    LT: SYMBOL.LT,
    GT: SYMBOL.GT,
    LE: SYMBOL.LE,
    GE: SYMBOL.GE,
} as const

export type LogicalOperator = typeof LOGICAL_OPERATORS[keyof typeof LOGICAL_OPERATORS]
export type ComparisonOperator = typeof COMPARISON_OPERATORS[keyof typeof COMPARISON_OPERATORS]
export type Operator = LogicalOperator | ComparisonOperator | string

export class ComparisonNode implements Node {
    constructor(
        private readonly left: Node,
        private readonly operator: Operator,
        private readonly right: Node,
    ) {}

    interpret(params: Parameters): string {
        return `${this.left.interpret(params)} ${this.operator} ${this.right.interpret(params)}`
    }
}

export class ConjunctionNode implements Node {
    constructor(
        private readonly operator: Operator,
        private readonly conditions: ArrayLike<Node>,
        private readonly grouped: boolean = false,
    ) {}

    interpret(params: Parameters): string {
        const output: string = interpretAll(castArray(this.conditions), params).join(
            ` ${this.operator} `,
        )

        return this.grouped ? sql.group(output) : output
    }
}

export class ModifierNode implements Node {
    constructor(
        private readonly modifier: Operator,
        private readonly operand: Node,
        private readonly position: 'prefix' | 'suffix',
    ) {}

    interpret(params: Parameters): string {
        return this.position === 'prefix'
            ? `${this.modifier} ${this.operand.interpret(params)}`
            : `${this.operand.interpret(params)} ${this.modifier}`
    }
}
