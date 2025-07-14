import type { SupportedValueType } from 'node:sqlite'

// ---

export type ArrayLike<T> = T | T[]

export function castArray<T>(value: ArrayLike<T>): T[] {
    return Array.isArray(value) ? value : [value]
}

export type AnyObject = { [key: string]: any }

// ---

export type Maybe<T> = T | null | undefined

export function isDefined<T>(value: Maybe<T>): value is T {
    return value !== null && value !== undefined
}

// ---

export class IndexedStorage<T> {
    private _entries: Map<number, T> = new Map()
    private _next: number = 1

    get size(): number {
        return this._entries.size
    }

    get next(): number {
        return this._next
    }

    get current(): number {
        return this._next - 1
    }

    get values(): readonly T[] {
        return Array.from(this._entries.values()) as readonly T[]
    }

    keys(): IterableIterator<number> {
        return this._entries.keys()
    }

    entries(): IterableIterator<[number, T]> {
        return this._entries.entries()
    }

    set(entry: T): number {
        if (this._next >= Number.MAX_SAFE_INTEGER) {
            throw new Error(`Integer overflow: too many nodes`)
        }
        const index: number = this._next
        this._entries.set(this._next++, entry)
        return index
    }

    setMany(entries: ArrayLike<T>): number[] {
        return castArray(entries).map((e) => this.set(e))
    }

    get(index: number): Maybe<T> {
        return this._entries.get(index)
    }

    find(predicate: (value: T, index: number) => boolean): Maybe<T> {
        for (const [index, value] of this._entries) {
            if (predicate(value, index)) return value
        }
        return undefined
    }

    filter(predicate: (value: T, index: number) => boolean): T[] {
        const result: T[] = []
        for (const [index, value] of this._entries) {
            if (predicate(value, index)) result.push(value)
        }
        return result
    }

    delete(index: number): boolean {
        return this._entries.delete(index)
    }

    has(index: number): boolean {
        return this._entries.has(index)
    }

    clear() {
        this._entries.clear()
        this._next = 1
    }
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
