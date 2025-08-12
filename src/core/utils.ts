// Array helpers
export type ArrayLike<T> = T | T[]

export function castArray<T>(value: ArrayLike<T>): T[] {
    return Array.isArray(value) ? value : [value]
}

// Misc. helpers
export type Maybe<T> = T | null | undefined

export function isDefined<T>(value: Maybe<T>): value is T {
    return value !== null && value !== undefined
}
