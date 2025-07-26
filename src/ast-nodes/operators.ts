import { type ArrayLike, castArray } from '~/core/utils.ts'
import { SQL_KEYWORDS as SQL, SQL_SYMBOLS as SYMBOL } from '~/core/sql-constants.ts'
import { sql } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import type { Node } from '~/core/node.ts'

export type LogicalOperator = typeof LOGICAL_OPERATORS[keyof typeof LOGICAL_OPERATORS]

export const LOGICAL_OPERATORS = {
    AND: SQL.AND,
    OR: SQL.OR,
} as const

/** */
export class LogicalNode implements Node {
    constructor(
        private readonly op: LogicalOperator,
        private readonly conditions: ArrayLike<Node>,
    ) {}

    interpret(params: Parameters): string {
        const parts: string[] = castArray(this.conditions).map((n) => n.interpret(params))
        return sql.parens(parts.join(` ${this.op} `))
    }
}

export type ComparisonOperator = typeof COMPARISON_OPERATORS[keyof typeof COMPARISON_OPERATORS]

export const COMPARISON_OPERATORS = {
    EQ: SYMBOL.EQ,
    NE: SYMBOL.NE,
    LT: SYMBOL.LT,
    LE: SYMBOL.LE,
    GT: SYMBOL.GT,
    GE: SYMBOL.GE,
    IN: SQL.IN,
    LIKE: SQL.LIKE,
} as const

/** */
export class BinaryNode implements Node {
    constructor(
        private readonly left: Node,
        private readonly op: ComparisonOperator,
        private readonly right: Node,
    ) {}

    interpret(params: Parameters): string {
        return `${this.left.interpret(params)} ${this.op} ${this.right.interpret(params)}`
    }
}

export type UnaryOperator = {
    readonly text: string
    readonly position: 'prefix' | 'suffix'
}

export const UNARY_OPERATORS = {
    NOT: { text: SQL.NOT, position: 'prefix' },
    EXISTS: { text: SQL.EXISTS, position: 'prefix' },
    IS_NULL: { text: `${SQL.IS} ${SQL.NULL}`, position: 'suffix' },
    IS_NOT_NULL: { text: `${SQL.IS} ${SQL.NOT} ${SQL.NULL}`, position: 'suffix' },
} as const

/** */
export class UnaryNode implements Node {
    constructor(
        private readonly op: UnaryOperator,
        private readonly expression: Node,
    ) {}

    interpret(params: Parameters): string {
        return this.op.position === 'prefix'
            ? `${this.op.text} ${this.expression.interpret(params)}`
            : `${this.expression.interpret(params)} ${this.op.text}`
    }
}
