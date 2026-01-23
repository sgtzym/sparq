import type { SqlDataType } from '~core'

// ---------------------------------------------
// Parameter registry
// ---------------------------------------------

/**
 * Configuration options for parameter registry behavior.
 */
interface ParameterRegOptions {
	deduplication?: boolean
	prefix?: string
	style?: 'named' | 'positional'
}

/**
 * Manages SQL query parameters with automatic deduplication.
 * Prevents SQL injection through proper parameterization.
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
	 * Automatically deduplicates identical values, if enabled.
	 *
	 * @param value - The value to parameterize
	 * @param name - Optional custom parameter name
	 * @returns The parameter placeholder (e.g., ':p1' or ':custom')
	 *
	 * @example
	 * ```ts
	 * params.add('hello')           // ':p1'
	 * params.add('hello')           // ':p1' (deduplicated)
	 * params.add('world', 'custom') // ':custom'
	 * params.add(42)                // ':p2'
	 * params.add(null)              // ':p3'
	 * ```
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

	/**
	 * Gets all parameter values as an array in registration order.
	 * Removes duplicates when deduplication is enabled.
	 *
	 * @returns Array of parameter values ready for query execution
	 *
	 * @example
	 * ```ts
	 * params.add('John')
	 * params.add('Jane')
	 * params.add(25)
	 * params.toArray() // ['John', 'Jane', 25]
	 * ```
	 */
	toArray(): readonly SqlDataType[] {
		return this.#positions
			.filter((name, index, self) => self.indexOf(name) === index)
			.map((name) => this.#byName.get(name)!)
	}

	/**
	 * Gets all parameters as a name-value object mapping.
	 * Useful for debugging or drivers that accept named parameters.
	 *
	 * @returns Object mapping parameter names to their values
	 *
	 * @example
	 * ```ts
	 * params.add('John')
	 * params.add('Jane', 'custom')
	 * params.toObject() // { p1: 'John', custom: 'Jane' }
	 * ```
	 */
	toObject(): Readonly<Record<string, SqlDataType>> {
		return Object.fromEntries(this.#byName)
	}

	/**
	 * Gets the current parameter index (number of unique parameters registered).
	 *
	 * @returns The total count of unique parameters
	 *
	 * @example
	 * ```ts
	 * params.add('hello')
	 * params.add('world')
	 * params.index // 2
	 * ```
	 */
	get index(): number {
		return this.#index
	}
}
