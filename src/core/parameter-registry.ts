import type { SqlValue } from '~/core/sql.ts'

interface ParameterRegistryOptions {
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
export class ParameterRegistry {
    #byValue = new Map<SqlValue, string>() // value -> name
    #byName = new Map<string, SqlValue>() // name -> value
    #index = 0
    #positions: string[] = []
    readonly #options: Required<ParameterRegistryOptions>

    constructor(options: ParameterRegistryOptions = {}) {
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

    #isDuplicate(value: SqlValue): boolean {
        return this.#byValue.has(value)
    }

    #isNameSet(name: string): boolean {
        return this.#byName.has(name)
    }

    /**
     * Registers a parameter value and returns its placeholder.
     * Deduplicates identical values by default.
     *
     * @param {SqlValue} value - Value to parameterize
     * @param {string} name - Optional custom parameter name
     * @returns {string} Parameter placeholder (e.g., ':p1')
     */
    add(value: SqlValue, name?: string): string {
        const { deduplication, prefix } = this.#options

        // 🛡️ Check for duplicates, return existing
        if (deduplication && this.#isDuplicate(value)) {
            return this.#format(this.#byValue.get(value)!)
        }

        const paramName = name || `${prefix}${++this.#index}`

        // 🛡️ Check for name conflicts, return existing
        if (!this.#isNameSet(paramName)) {
            this.#byValue.set(value, paramName)
            this.#byName.set(paramName, value)
            this.#positions.push(paramName)
        }

        return this.#format(paramName)
    }

    toArray(): readonly SqlValue[] {
        return this.#positions
            .filter((name, index, self) => self.indexOf(name) === index)
            .map((name) => this.#byName.get(name)!)
    }

    toObject(): Readonly<Record<string, SqlValue>> {
        return Object.fromEntries(this.#byName)
    }

    get index(): number {
        return this.#index
    }
}
