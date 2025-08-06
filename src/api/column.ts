import type { Node, NodeArg, NodeConvertible } from '~/core/node.ts'
import type { Schema } from '~/core/schema-registry.ts'
import * as fac from '~/factories.ts'

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
        this._node = fac.id(_name)
    }

    get name(): string {
        return this._name
    }

    get node(): Node {
        return (this._node ??= fac.id(this.name)) // lazy init
    }

    // Set quantifiers

    distinct(): Node {
        return fac.distinct(this.node)
    }

    all(): Node {
        return fac.all(this.node)
    }

    // Sorting directions

    asc(): Node {
        return fac.asc(this.node)
    }
    
    desc(): Node {
        return fac.desc(this.node)
    }

    // Comparison operations
    #comparison(
        fn: (left: NodeArg, right: NodeArg) => Node,
        value: NodeArg,
    ): Node {
        return fn(this.node, value)
    }

    eq(value: ColDataType<TType>): Node {
        return this.#comparison(fac.eq, value)
    }

    ne(value: ColDataType<TType>): Node {
        return this.#comparison(fac.ne, value)
    }

    gt(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.gt, value)
    }

    lt(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.lt, value)
    }

    ge(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.ge, value)
    }

    le(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.le, value)
    }

    between(
        min: TType['type'] extends SqlNumber ? number : never,
        max: TType['type'] extends SqlNumber ? number : never,
    ): Node {
        return fac.between(this.node, min, max)
    }

    like(pattern: TType['type'] extends 'TEXT' ? string : never): Node {
        return this.#comparison(fac.like, pattern)
    }

    in(values: ColDataType<TType>[]): Node {
        return this.#comparison(fac.in_, fac.valueList(...values))
    }

    isNull(): Node {
        return fac.isNull(this.node)
    }

    isNotNull(): Node {
        return fac.isNotNull(this.node)
    }

    // Arithmetic operations
    add(value: TType['type'] extends SqlNumber ? number : never): Node {
        return fac.add(this.node, fac.val(value))
    }

    sub(value: TType['type'] extends SqlNumber ? number : never): Node {
        return fac.sub(this.node, fac.val(value))
    }

    mul(value: TType['type'] extends SqlNumber ? number : never): Node {
        return fac.mul(this.node, fac.val(value))
    }

    div(value: TType['type'] extends SqlNumber ? number : never): Node {
        return fac.div(this.node, fac.val(value))
    }

    // TODO(#sgtzym): String operations like UPPER, LOWER, LENGTH

    // Aggregate functions
    #aggregate(fn: (node: NodeArg) => Node, distinct?: boolean): Node {
        const agg: Node = fn(this.node)
        return distinct ? fac.distinct(agg) : agg
    }

    avg(distinct?: boolean): Node {
        return this.#aggregate(fac.avg, distinct)
    }

    count(distinct?: boolean): Node {
        return this.#aggregate(fac.count, distinct)
    }

    max(distinct?: boolean): Node {
        return this.#aggregate(fac.max, distinct)
    }

    min(distinct?: boolean): Node {
        return this.#aggregate(fac.min, distinct)
    }

    sum(distinct?: boolean): Node {
        return this.#aggregate(fac.sum, distinct)
    }

    // Misc.
    as(name: string): Node {
        return fac.alias(this.node, fac.id(name))
    }

    set(value: NodeArg): Node {
        return fac.assign(this.node, value)
    }
}
