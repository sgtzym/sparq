import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import {
    type ParameterReg,
    renderSqlNodes,
    type SqlNode,
    type SqlNodeValue,
    toSqlNode,
} from '~/core/node.ts'
import { id } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Common table expressions (CTEs)
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a CTE for making queries more readable.
 */
export class CteNode implements SqlNode {
    readonly priority: number = -10

    constructor(
        private readonly name: SqlNode,
        private readonly clauses: SqlNode[],
    ) {}

    render(params: ParameterReg): SqlString {
        const _name: SqlString = this.name.render(params)
        const _clauses: SqlString = renderSqlNodes(this.clauses, params).join(
            ' ',
        )

        return sql(`${_name} AS (${_clauses})`)
    }
}

/**
 * Represents the WITH modifier containing one or more CTEs
 */
export class WithNode implements SqlNode {
    readonly priority: number = -20

    constructor(
        private readonly ctes: ArrayLike<CteNode>,
        private readonly recursive: boolean = false,
    ) {}

    render(params: ParameterReg): SqlString {
        const _ctes: SqlString = renderSqlNodes(this.ctes, params).join(', ')

        return sql(this.recursive ? 'WITH RECURSIVE' : 'WITH', _ctes)
    }
}

// -> 🏭 Factories

/**
 * Creates a CTE (WITH).
 * @param name The CTE's alias name
 * @param query The subquery for temp. results as list of nodes
 * @returns A CTE SqlNode
 */
export const cte = (name: string, query: SqlNodeValue[]): CteNode =>
    new CteNode(id(name), query.map(toSqlNode))

export const with_ = (recursive?: boolean, ...ctes: CteNode[]): WithNode =>
    new WithNode(ctes, recursive)
