import { type ArrayLike, castArray } from '~/core/utils.ts'
import { type SqlParam, type SqlString, toSqlParam } from '~/core/sql.ts'
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
    #byName = new Map<string, SqlParam>() // name -> value
    #byValue = new Map<SqlParam, string>() // value -> name
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

    #isDuplicate(value: SqlParam): boolean {
        return this.#byValue.has(value)
    }

    #hasName(name: string): boolean {
        return this.#byName.has(name)
    }

    /**
     * Registers a parameter value and returns its placeholder.
     * Deduplicates identical values by default.
     *
     * @param {SqlParam} value - Value to parameterize
     * @param {string} name - Optional custom parameter name
     * @returns {string} Parameter placeholder (e.g., ':p1')
     */
    add(value: SqlParam, name?: string): string {
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

    toArray(): readonly SqlParam[] {
        return this.#positions
            .filter((name, index, self) => self.indexOf(name) === index)
            .map((name) => this.#byName.get(name)!)
    }

    toObject(): Readonly<Record<string, SqlParam>> {
        return Object.fromEntries(this.#byName)
    }

    get index(): number {
        return this.#index
    }
}

// ---------------------------------------------
// Node basics
// ---------------------------------------------

export type Param = SqlParam | boolean | Date | Record<string, any> | undefined

export interface Node {
    readonly priority?: number
    render(params: ParameterReg): SqlString
}

/** Node type guard */
export function isNode(arg: any): arg is Node {
    return arg && typeof arg.render === 'function'
}

// ---------------------------------------------
// Sorting and rendering
// ---------------------------------------------

/**
 * @param nodes
 * @param prio
 * @returns
 */
export function sortAST(nodes: Node[]): readonly Node[] {
    return [...nodes].sort((a, b) => {
        const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER
        const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER

        return aPriority - bPriority
    })
}

/**
 * @param nodes
 * @param params
 * @returns
 */
export function renderAll(
    nodes: ArrayLike<Node>,
    params: ParameterReg,
): string[] {
    return castArray(nodes).map((n) => n.render(params))
}

/**
 * @param nodes
 * @param params
 * @returns
 */
export function renderAST(
    nodes: ArrayLike<Node>,
    params: ParameterReg,
): string {
    return renderAll([...sortAST(castArray(nodes))], params).join(' ')
}

// ---------------------------------------------
// Conversion
// ---------------------------------------------

export interface NodeConvertible {
    readonly node: Node
}

export type NodeArg = Node | NodeConvertible | Param

/** Node convertible type guard */
export function isNodeConvertible(arg: any): arg is NodeConvertible {
    return arg && typeof arg === 'object' && 'node' in arg && isNode(arg.node)
}

/** Converts args to Nodes */
export function toNode(arg: NodeArg): Node {
    if (isNode(arg)) return arg
    if (isNodeConvertible(arg)) return arg.node
    return new LiteralNode(toSqlParam(arg))
}
