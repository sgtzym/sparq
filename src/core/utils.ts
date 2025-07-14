import type { SupportedValueType } from 'node:sqlite'

// ---

export type ArrayLike<T> = T | T[]

export function castArray<T>(value: ArrayLike<T>): T[] {
    return Array.isArray(value) ? value : [value]
}

// ---

export type Maybe<T> = T | null | undefined

export function isDefined<T>(value: Maybe<T>): value is T {
    return value !== null && value !== undefined
}

// ---

// 🛡️ Type-guards values.
export function isSupportedValueType(
    value: unknown,
): value is SupportedValueType {
    switch (true) {
        case value === null:
        case value instanceof Uint8Array:
            return true
        case typeof value === 'number':
        case typeof value === 'bigint':
        case typeof value === 'string':
            return true
        default:
            return false
    }
}

// 🧼 Casts values to supported types.
export function castSupportedValueType(value: any): SupportedValueType {
    switch (true) {
        case isSupportedValueType(value):
            return value
        case value === undefined:
            return null
        case typeof value === 'boolean':
            return value ? 1 : 0
        case value instanceof Date:
            return value.toISOString()
        case Array.isArray(value) || typeof value === 'object':
            try {
                return JSON.stringify(value)
            } catch (error) {
                throw new TypeError(
                    `Unable to serialize value: ${error}`,
                )
            }
        default:
            throw new TypeError(
                `Unsupported literal type: ${value}`,
            )
    }
}
