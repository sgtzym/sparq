import type { Node, NodeArg, NodeConvertible } from '~/core/node.ts'
import type { Schema } from '~/core/schema-registry.ts'
import { id, val } from '~/nodes/primitives.ts'
import {
    add,
    alias,
    all,
    asc,
    between,
    desc,
    distinct,
    div,
    eq,
    ge,
    gt,
    in_,
    isNotNull,
    isNull,
    le,
    like,
    lt,
    mul,
    ne,
    sub,
} from '~/nodes/expressions.ts'
import { avg, count, max, min, sum } from '~/nodes/aggregates.ts'
import { assign, valueList } from '~/nodes/values.ts'

type ColDataType<T extends Schema[keyof Schema]> = T['type'] extends 'TEXT'
    ? string
    : T['type'] extends 'INTEGER' ? number
    : T['type'] extends 'REAL' ? number
    : T['type'] extends 'BLOB' ? Uint8Array
    : null

type SqlNumber = 'INTEGER' | 'REAL'

/**
 * Represents a database column with type-safe operations.
 * Provides methods for SQL comparisons, aggregates, and transformations.
 */
export class Column<TType extends Schema[keyof Schema] = any>
    implements NodeConvertible {
    private _node?: Node

    constructor(
        private readonly _name: string,
        private readonly _type: TType['type'],
    ) {
        this._node = id(_name)
    }

    get name(): string {
        return this._name
    }

    get node(): Node {
        return (this._node ??= id(this.name)) // lazy init
    }

    // Set quantifiers

    distinct(): Node {
        return distinct(this.node)
    }

    all(): Node {
        return all(this.node)
    }

    // Sorting directions

    asc(): Node {
        return asc(this.node)
    }

    desc(): Node {
        return desc(this.node)
    }

    // Comparison operations
    #comparison(
        fn: (left: NodeArg, right: NodeArg) => Node,
        value: NodeArg,
    ): Node {
        return fn(this.node, value)
    }

    eq(value: ColDataType<TType>): Node {
        return this.#comparison(eq, value)
    }

    ne(value: ColDataType<TType>): Node {
        return this.#comparison(ne, value)
    }

    gt(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(gt, value)
    }

    lt(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(lt, value)
    }

    ge(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(ge, value)
    }

    le(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(le, value)
    }

    between(
        min: TType['type'] extends SqlNumber ? number : never,
        max: TType['type'] extends SqlNumber ? number : never,
    ): Node {
        return between(this.node, min, max)
    }

    like(pattern: TType['type'] extends 'TEXT' ? string : never): Node {
        return this.#comparison(like, pattern)
    }

    in(values: ColDataType<TType>[]): Node {
        return this.#comparison(in_, valueList(...values))
    }

    isNull(): Node {
        return isNull(this.node)
    }

    isNotNull(): Node {
        return isNotNull(this.node)
    }

    // Arithmetic operations
    add(value: TType['type'] extends SqlNumber ? number : never): Node {
        return add(this.node, val(value))
    }

    sub(value: TType['type'] extends SqlNumber ? number : never): Node {
        return sub(this.node, val(value))
    }

    mul(value: TType['type'] extends SqlNumber ? number : never): Node {
        return mul(this.node, val(value))
    }

    div(value: TType['type'] extends SqlNumber ? number : never): Node {
        return div(this.node, val(value))
    }

    // TODO(#sgtzym): String operations like UPPER, LOWER, LENGTH

    // Aggregate functions
    #aggregate(fn: (node: NodeArg) => Node, distinct_?: boolean): Node {
        const agg: Node = fn(this.node)
        return distinct_ ? distinct(agg) : agg
    }

    avg(distinct?: boolean): Node {
        return this.#aggregate(avg, distinct)
    }

    count(distinct?: boolean): Node {
        return this.#aggregate(count, distinct)
    }

    max(distinct?: boolean): Node {
        return this.#aggregate(max, distinct)
    }

    min(distinct?: boolean): Node {
        return this.#aggregate(min, distinct)
    }

    sum(distinct?: boolean): Node {
        return this.#aggregate(sum, distinct)
    }

    // Misc.
    as(name: string): Node {
        return alias(this.node, id(name))
    }

    set(value: NodeArg): Node {
        return assign(this.node, value)
    }
}
