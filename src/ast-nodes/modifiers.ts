import { SQL_KEYWORDS as SQL } from '~/core/sql-constants.ts'
import type { ParameterRegistry } from '~/core/parameter-registry.ts'
import type { Node } from '~/core/node.ts'

/** AST nodes representing SQL modifiers 🧬 */

export class AliasNode implements Node {
    constructor(
        private readonly expr: Node,
        private readonly alias: Node,
    ) {}

    interpret(params: ParameterRegistry): string {
        return `${this.expr.interpret(params)} ${SQL.AS} ${
            this.alias.interpret(params)
        }`
    }
}

export const SET_QUANTIFIERS = {
    DISTINCT: SQL.DISTINCT,
    ALL: SQL.ALL,
} as const

export type SetQuantifier = typeof SET_QUANTIFIERS[keyof typeof SET_QUANTIFIERS]

export class SetQuantifierNode implements Node {
    constructor(
        private readonly quantifier: SetQuantifier,
        private readonly expr?: Node,
    ) {}

    interpret(params: ParameterRegistry): string {
        return this.expr
            ? `${this.quantifier} ${this.expr?.interpret(params)}`
            : this.quantifier
    }
}

export const SORTING_DIRECTIONS = {
    ASC: SQL.ASC,
    DESC: SQL.DESC,
} as const

export type SortingDirection =
    typeof SORTING_DIRECTIONS[keyof typeof SORTING_DIRECTIONS]

export class SortingDirectionNode implements Node {
    constructor(
        private readonly expr: Node,
        private readonly dir: SortingDirection,
    ) {}

    interpret(params: ParameterRegistry): string {
        return `${this.expr.interpret(params)} ${this.dir}`
    }
}
