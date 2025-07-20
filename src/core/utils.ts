// Array helpers

type ArrayLike<T> = T | T[]

function castArray<T>(value: ArrayLike<T>): T[] {
    return Array.isArray(value) ? value : [value]
}

export { type ArrayLike, castArray }

// Misc. helpers

type Maybe<T> = T | null | undefined

function isDefined<T>(value: Maybe<T>): value is T {
    return value !== null && value !== undefined
}

export { isDefined, type Maybe }
