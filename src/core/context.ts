import { type ArrayLike, castArray, type Maybe } from '@/core/utils.ts'
import type { SqlValue } from './sql-types.ts'

export class Context<T = SqlValue> {
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

    get keys(): IterableIterator<number> {
        return this._entries.keys()
    }

    get entries(): IterableIterator<[number, T]> {
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
