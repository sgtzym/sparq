import type { ArrayLike } from '~/core/utils.ts'
import { sql, type SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    type ParameterReg,
    renderAll,
    toNode,
} from '~/core/node.ts'
import { id } from './primitives.ts'

// ---------------------------------------------
// Common table expressions (CTEs)
// ---------------------------------------------

// -> 🔷 Nodes

/**
 * Represents a CTE for making queries more readable.
 */
export class CteNode implements Node {
    readonly priority: number = -10

    constructor(
        private readonly name: Node,
        private readonly clauses: Node[],
    ) {}

    render(params: ParameterReg): SqlString {
        const _name: SqlString = this.name.render(params)
        const _clauses: SqlString = renderAll(this.clauses, params).join(' ')

        return sql(`${_name} AS (${_clauses})`)
    }
}

/**
 * Represents the WITH modifier containing one or more CTEs
 */
export class WithNode implements Node {
    readonly priority: number = -20

    constructor(
        private readonly ctes: ArrayLike<CteNode>,
        private readonly recursive: boolean = false,
    ) {}

    render(params: ParameterReg): SqlString {
        const _ctes: SqlString = renderAll(this.ctes, params).join(', ')

        return sql(this.recursive ? 'WITH RECURSIVE' : 'WITH', _ctes)
    }
}

// -> 🏭 Factories

/**
 * Creates a CTE (WITH).
 * @param name The CTE's alias name
 * @param query The subquery for temp. results as list of nodes
 * @returns A CTE node
 */
export const cte = (name: string, query: NodeArg[]): CteNode =>
    new CteNode(id(name), query.map(toNode))

export const with_ = (recursive?: boolean, ...ctes: CteNode[]): WithNode =>
    new WithNode(ctes, recursive)
