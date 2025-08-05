import {
    type Node,
    type NodeArg,
    type NodeConvertible,
    type Param,
    toNode,
} from '~/core/node.ts'
import type { Schema } from '~/core/schema-registry.ts'

import * as fac from '~/factories.ts'

type ColDataType<
    T extends Schema,
    K extends keyof T,
> = T[K]['type'] extends 'TEXT' ? string
    : T[K]['type'] extends 'INTEGER' ? number
    : T[K]['type'] extends 'REAL' ? number
    : T[K]['type'] extends 'BLOB' ? Uint8Array
    : null

type SqlNumber = 'INTEGER' | 'REAL'

export class Column<TSchema extends Schema = any, K extends keyof TSchema = any>
    implements NodeConvertible {
    private _node?: Node

    constructor(
        private readonly _name: K & string,
        readonly schema?: TSchema,
    ) {
        this._node = fac.id(_name)
    }

    get name(): string {
        return this._name
    }

    get node(): Node {
        return (this._node ??= fac.id(this.name)) // lazy init
    }

    distinct(): Node {
        return fac.distinct(this.node)
    }

    all(): Node {
        return fac.all(this.node)
    }

    // Comparison operations
    #comparison(
        fn: (left: NodeArg, right: NodeArg) => Node,
        value: NodeArg,
    ): Node {
        return fn(this.node, value)
    }

    eq(value: ColDataType<TSchema, K>): Node {
        return this.#comparison(fac.eq, value)
    }

    ne(value: ColDataType<TSchema, K>): Node {
        return this.#comparison(fac.ne, value)
    }

    gt(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.gt, value)
    }

    lt(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.lt, value)
    }

    ge(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.ge, value)
    }

    le(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(fac.le, value)
    }

    between(
        min: TSchema[K]['type'] extends SqlNumber ? number : never,
        max: TSchema[K]['type'] extends SqlNumber ? number : never,
    ): Node {
        return fac.between(this.node, min, max)
    }

    like(pattern: TSchema[K]['type'] extends 'TEXT' ? string : never): Node {
        return this.#comparison(fac.like, pattern)
    }

    in(values: ColDataType<TSchema, K>[]): Node {
        return this.#comparison(fac.in_, fac.valueList(...values))
    }

    isNull(): Node {
        return fac.isNull(this.node)
    }

    isNotNull(): Node {
        return fac.isNotNull(this.node)
    }

    // Arithmetic operations
    add(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
        return fac.add(this.node, fac.val(value))
    }

    sub(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
        return fac.sub(this.node, fac.val(value))
    }

    mul(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
        return fac.mul(this.node, fac.val(value))
    }

    div(value: TSchema[K]['type'] extends SqlNumber ? number : never): Node {
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
