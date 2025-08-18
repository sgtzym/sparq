import { type ArrayLike, castArray } from '~/core/utils.ts'
import { isSqlDataType, type SqlDataType, type SqlString } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'

// ---------------------------------------------
// SQL node basics
// ---------------------------------------------

export type SqlParam =
    | SqlDataType
    | boolean
    | Date
    | Record<string, any>
    | undefined

/** Param type guard */
export function isSqlParam(value: unknown): value is SqlParam {
    const isBoolean = typeof value === 'boolean'
    const isDate = value instanceof Date
    const isObject = typeof value === 'object' && value !== null

    return isSqlDataType(value) || isBoolean || isDate || isObject
}

/** Base SQL node class */
export abstract class SqlNode {
    protected readonly _priority: number = -1

    get priority(): number {
        return this._priority
    }

    abstract render(params: ParameterReg): SqlString
}

/** Node type guard */
export function isSqlNode(value: any): value is SqlNode {
    return value &&
        (value instanceof SqlNode || typeof value.render === 'function')
}

export type SqlNodeValue = SqlNode | SqlParam

// ---------------------------------------------
// Sorting and rendering
// ---------------------------------------------

/**
 * Sorts nodes based on their priority.
 */
export function sortSqlNodes(nodes: SqlNode[]): readonly SqlNode[] {
    return [...nodes].sort((a, b) => {
        const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER
        const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER

        return aPriority - bPriority
    })
}

/**
 * Renders multiple nodes at once.
 * @param nodes - The nodes to render
 * @param params - The parameter list
 * @param sort  - If set, sorts nodes based on their priority
 * @returns A list of rendered SQL strings
 */
export function renderSqlNodes(
    nodes: ArrayLike<SqlNode>,
    params: ParameterReg,
    sort: boolean = false,
): string[] {
    return sort
        ? [...sortSqlNodes(castArray(nodes))].map((n) => n.render(params))
        : castArray(nodes).map((n) => n.render(params))
}
