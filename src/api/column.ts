import type { Node, NodeArg, Param } from '~/core/node.ts'
import * as fac from '~/factories.ts'

export class Column {
    private _node?: Node

    constructor(
        private readonly name: string,
    ) {}

    private get node(): Node {
        return this._node ??= fac.name(this.name) // lazy init
    }

    // ---------------------------------------------
    // Value Comparisons, Assignments and Aliases
    // ---------------------------------------------

    #comparison(
        fn: (left: NodeArg, right: NodeArg) => Node,
        value: NodeArg,
    ): Node {
        return fn(this.node, value)
    }

    eq(value: Param): Node {
        return this.#comparison(fac.eq, value as Param)
    }

    ne(value: Param): Node {
        return this.#comparison(fac.ne, value as Param)
    }

    gt(value: Param): Node {
        return this.#comparison(fac.gt, value as Param)
    }

    lt(value: Param): Node {
        return this.#comparison(fac.lt, value as Param)
    }

    ge(value: Param): Node {
        return this.#comparison(fac.ge, value as Param)
    }

    le(value: Param): Node {
        return this.#comparison(fac.le, value as Param)
    }

    like(value: Param): Node {
        return this.#comparison(fac.like, value as Param)
    }

    in(values: Param[]): Node {
        return this.#comparison(fac.in_, fac.valueList(...values as Param[]))
    }

    between(min: Param, max: Param): Node {
        return fac.between(this.node, min as Param, max as Param)
    }

    set(value: Param): Node {
        return fac.assign(this.node, value as Param)
    }

    as(name: Param): Node {
        return fac.alias(this.node, fac.name(name as string))
    }

    // ---------------------------------------------
    // Aggregate Shorthands
    // ---------------------------------------------

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

    // ---------------------------------------------
    // Utilities
    // ---------------------------------------------

    toString(): string {
        return this.name
    }

    toNode(): Node {
        return this.node
    }
}
