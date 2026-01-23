/**
 * Represents a value that can be either a single item or an array of items.
 * Use this when a function should accept both formats flexibly.
 */
export type ArrayLike<T> = T | T[]

/**
 * Normalizes values to array format.
 * Handles both single values and arrays uniformly.
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
 * Validates non-null values.
 * Returns true for defined values, false for null/undefined.
 */
export function isDefined<T>(value: Maybe<T>): value is T {
	return value !== null && value !== undefined
}
