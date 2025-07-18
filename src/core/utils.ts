import type { SupportedValueType } from 'node:sqlite'
import type { Node } from '@/core/node.ts'
import { IdentifierNode, RawNode } from '@/nodes/primitives.ts'

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

// Node helpers

type NodeArg = number | string | (() => Node)

/**
 * Casts args to Nodes 🧼
 * @param arg any string, number or Node function - e.g. select()
 * @returns a single Node instance
 */
function toNode(arg: NodeArg) {
    return typeof arg === 'function'
        ? arg()
        : typeof arg === 'number'
        ? new RawNode(arg)
        : new IdentifierNode(arg)
}

export { type NodeArg, toNode }

// Type-guards values 🛡️
function isSupportedValueType(
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

/**
 * Casts values to supported types 🧼
 * @param value any input value
 * @returns input value as a supported type
 */
function castSupportedValueType(value: any): SupportedValueType {
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

export { castSupportedValueType, isSupportedValueType }
