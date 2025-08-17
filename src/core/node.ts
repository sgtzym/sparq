import { type ArrayLike, castArray } from '~/core/utils.ts'
import { type SqlDataType, type SqlString, toSqlDataType } from '~/core/sql.ts'
import { LiteralNode } from '~/nodes/primitives.ts'

// ---------------------------------------------
// Parameter registry
// ---------------------------------------------

interface ParameterRegOptions {
    deduplication?: boolean
    prefix?: string
    style?: 'named' | 'positional'
}

/**
 * Manages SQL query parameters with deduplication and formatting.
 * Supports both named and positional parameter styles.
 *
 * @example
 * ```typescript
 * const params = new Parameters()
 * params.add('John')     // Returns ':p1'
 * params.add('John')     // Returns ':p1' (deduplicated)
 * params.add('Jane')     // Returns ':p2'
 * params.toArray()       // ['John', 'Jane']
 * ```
 */
export class ParameterReg {
    #byName = new Map<string, SqlDataType>() // name -> value
    #byValue = new Map<SqlDataType, string>() // value -> name
    #index = 0
    #positions: string[] = []
    readonly #options: Required<ParameterRegOptions>

    constructor(options: ParameterRegOptions = {}) {
        this.#options = {
            deduplication: true,
            prefix: 'p',
            style: 'named',
            ...options,
        }
    }

    #format(name: string): string {
        if (this.#options.style === 'positional') {
            const uniqueNames = [...new Set(this.#positions)]
            const position = uniqueNames.indexOf(name) + 1
            return `:${position}`
        }
        return `:${name}`
    }

    #isDuplicate(value: SqlDataType): boolean {
        return this.#byValue.has(value)
    }

    #hasName(name: string): boolean {
        return this.#byName.has(name)
    }

    /**
     * Registers a parameter value and returns its placeholder.
     * Deduplicates identical values by default.
     *
     * @param {SqlDataType} value - Value to parameterize
     * @param {string} name - Optional custom parameter name
     * @returns {string} Parameter placeholder (e.g., ':p1')
     */
    add(value: SqlDataType, name?: string): string {
        const { deduplication, prefix } = this.#options

        // 🛡️ Check for duplicates, return existing
        if (deduplication && this.#isDuplicate(value)) {
            return this.#format(this.#byValue.get(value)!)
        }

        const paramName = name || `${prefix}${++this.#index}`

        // 🛡️ Check for name conflicts, return existing
        if (!this.#hasName(paramName)) {
            this.#byValue.set(value, paramName)
            this.#byName.set(paramName, value)
            this.#positions.push(paramName)
        }

        return this.#format(paramName)
    }

    toArray(): readonly SqlDataType[] {
        return this.#positions
            .filter((name, index, self) => self.indexOf(name) === index)
            .map((name) => this.#byName.get(name)!)
    }

    toObject(): Readonly<Record<string, SqlDataType>> {
        return Object.fromEntries(this.#byName)
    }

    get index(): number {
        return this.#index
    }
}

// ---------------------------------------------
// Node basics
// ---------------------------------------------

export abstract class SqlNode {
    readonly priority?: number
    abstract render(params: ParameterReg): SqlString
}

/** Node type guard */
export function isSqlNode(arg: any): arg is SqlNode {
    return arg && typeof arg.render === 'function'
}

export type SqlParam =
    | SqlDataType
    | boolean
    | Date
    | Record<string, any>
    | undefined

export type SqlNodeValue = SqlNode | SqlParam

/** Converts values to Nodes */
export function toSqlNode(value: SqlNodeValue): SqlNode {
    if (value instanceof SqlNode) return value
    return new LiteralNode(toSqlDataType(value))
}

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
