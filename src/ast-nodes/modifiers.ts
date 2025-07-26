import { SQL_KEYWORDS as SQL } from '~/core/sql-constants.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import type { Node } from '~/core/node.ts'

export const SET_QUANTIFIERS = {
    DISTINCT: SQL.DISTINCT,
    ALL: SQL.ALL,
} as const

export const SORTING_DIRECTIONS = {
    ASC: SQL.ASC,
    DESC: SQL.DESC,
} as const

export type SetQuantifier = typeof SET_QUANTIFIERS[keyof typeof SET_QUANTIFIERS]
export type SortingDirection = typeof SORTING_DIRECTIONS[keyof typeof SORTING_DIRECTIONS]

/** */
export class AliasNode implements Node {
    constructor(
        private readonly expression: Node,
        private readonly alias: Node,
    ) {}

    interpret(params: Parameters): string {
        return `${this.expression.interpret(params)} ${SQL.AS} ${this.alias.interpret(params)}`
    }
}

/** */
export class SetQuantifierNode implements Node {
    constructor(
        private readonly quantifier: SetQuantifier,
        private readonly expression?: Node,
    ) {}

    interpret(params: Parameters): string {
        return this.expression
            ? `${this.quantifier} ${this.expression?.interpret(params)}`
            : this.quantifier
    }
}

/** */
export class SortingDirectionNode implements Node {
    constructor(
        private readonly expression: Node,
        private readonly dir: SortingDirection,
    ) {}

    interpret(params: Parameters): string {
        return `${this.expression.interpret(params)} ${this.dir}`
    }
}
