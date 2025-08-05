import type { Node, NodeArg, NodeConvertible, Param } from '../core/node.ts'
import type { ColumnValue, Schema } from '../core/schema-registry.ts'

import * as fac from '~/factories.ts'

export class Column<
    TSchema extends Schema = any,
    K extends keyof TSchema = any,
> implements NodeConvertible {
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
        return this._node ??= fac.id(this.name) // lazy init
    }

    #comparison(
        fn: (left: NodeArg, right: NodeArg) => Node,
        value: NodeArg,
    ): Node {
        return fn(this.node, value)
    }

    eq(value: ColumnValue<TSchema, K>): Node {
        return this.#comparison(fac.eq, value)
    }

    ne(value: ColumnValue<TSchema, K>): Node {
        return this.#comparison(fac.ne, value)
    }

    gt(
        value: TSchema[K]['type'] extends 'INTEGER' | 'REAL' ? number : never,
    ): Node {
        return this.#comparison(fac.gt, value)
    }

    lt(
        value: TSchema[K]['type'] extends 'INTEGER' | 'REAL' ? number : never,
    ): Node {
        return this.#comparison(fac.lt, value)
    }

    ge(
        value: TSchema[K]['type'] extends 'INTEGER' | 'REAL' ? number : never,
    ): Node {
        return this.#comparison(fac.ge, value)
    }

    le(
        value: TSchema[K]['type'] extends 'INTEGER' | 'REAL' ? number : never,
    ): Node {
        return this.#comparison(fac.le, value)
    }

    between(
        min: TSchema[K]['type'] extends 'INTEGER' | 'REAL' ? number : never,
        max: TSchema[K]['type'] extends 'INTEGER' | 'REAL' ? number : never,
    ): Node {
        return fac.between(this.node, min, max)
    }

    like(pattern: TSchema[K]['type'] extends 'TEXT' ? string : never): Node {
        return this.#comparison(fac.like, pattern)
    }

    in(values: ColumnValue<TSchema, K>[]): Node {
        return this.#comparison(fac.in_, fac.valueList(...values))
    }

    isNull(): Node {
        return fac.isNull(this.node)
    }

    isNotNull(): Node {
        return fac.isNotNull(this.node)
    }

    set(value: Param): Node {
        return fac.assign(this.node, value as Param)
    }

    as(name: string): Node {
        return fac.alias(this.node, fac.id(name))
    }

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
}
