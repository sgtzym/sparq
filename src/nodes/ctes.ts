import { sql, type SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    type ParameterReg,
    renderAll,
    toNode,
} from '~/core/node.ts'
import { id } from './primitives.ts'
import { ArrayLike } from '../core/utils.ts'

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
        private readonly query: Node,
    ) {}

    render(params: ParameterReg): SqlString {
        const _name: SqlString = this.name.render(params)
        const _query: SqlString = this.query.render(params)

        return sql(`${_name} AS (${_query})`)
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
 * @param query The subquery for temp. results
 * @returns A CTE node
 */
export const cte = (name: string, query: NodeArg): CteNode =>
    new CteNode(id(name), toNode(query))

export const withCte = (recursive?: boolean, ...ctes: CteNode[]): WithNode =>
    new WithNode(ctes, recursive)
