/**
 * Represents a value that can be either a single item or an array of items.
 * Use this when a function should accept both formats flexibly.
 */
export type ArrayLike<T> = T | T[]

/**
 * Converts a single value or array into an array format.
 * Ensures consistent array handling regardless of input type.
 *
 * @param value - The value or array to convert
 * @returns An array containing the value(s)
 *
 * @example
 * ```ts
 * castArray('hello')     // ['hello']
 * castArray([1, 2, 3])   // [1, 2, 3]
 * castArray(42)          // [42]
 * ```
 */
export function castArray<T>(value: ArrayLike<T>): T[] {
    return Array.isArray(value) ? value : [value]
}

/**
 * Represents a value that might be null or undefined.
 * Use this for optional values that need explicit null checking.
 */
export type Maybe<T> = T | null | undefined

/**
 * Checks if a value is defined (not null or undefined).
 * Use this for safe value validation before processing.
 *
 * @param value - The value to check
 * @returns True if the value is defined, false otherwise
 *
 * @example
 * ```ts
 * isDefined('hello')    // true
 * isDefined(null)       // false
 * isDefined(undefined)  // false
 * isDefined(0)          // true
 * isDefined('')         // true
 * ```
 */
export function isDefined<T>(value: Maybe<T>): value is T {
    return value !== null && value !== undefined
}
