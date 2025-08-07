import type { Node, NodeArg, NodeConvertible } from '~/core/node.ts'
import type { Table } from './table.ts'
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

export type ColDataType<T extends Table[keyof Table]> = T['type'] extends 'TEXT'
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
export class Column<TType extends Table[keyof Table] = any>
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

    // -> Set quantifiers

    /**
     * Returns distinct values (DISTINCT).
     */
    distinct(): Node {
        return distinct(this.node)
    }

    /**
     * Returns all values (ALL).
     */
    all(): Node {
        return all(this.node)
    }

    // -> Sorting directions

    /**
     * Sorts in ascending order (ASC).
     */
    asc(): Node {
        return asc(this.node)
    }

    /**
     * Sorts in descending order (DESC).
     */
    desc(): Node {
        return desc(this.node)
    }

    // -> Comparison operations

    #comparison(
        fn: (left: NodeArg, right: NodeArg) => Node,
        value: NodeArg,
    ): Node {
        return fn(this.node, value)
    }

    /**
     * Tests for equality (=).
     * @param value - Value to test against
     */
    eq(value: ColDataType<TType>): Node {
        return this.#comparison(eq, value)
    }

    /**
     * Tests for inequality (!=).
     * @param value - Value to test against
     */
    ne(value: ColDataType<TType>): Node {
        return this.#comparison(ne, value)
    }

    /**
     * Tests if greater than (>).
     * @param value - Value to test against
     */
    gt(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(gt, value)
    }

    /**
     * Tests if less than (<).
     * @param value - Value to test against
     */
    lt(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(lt, value)
    }

    /**
     * Tests if greater than or equal to (>=).
     * @param value - Value to test against
     */
    ge(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(ge, value)
    }

    /**
     * Tests if less than or equal to (<=).
     * @param value - Value to test against
     */
    le(value: TType['type'] extends SqlNumber ? number : never): Node {
        return this.#comparison(le, value)
    }

    /**
     * Tests if value is within range (BETWEEN).
     * @param lower - Lower bound (inclusive)
     * @param upper - Upper bound (inclusive)
     */
    between(
        lower: TType['type'] extends SqlNumber ? number : never,
        upper: TType['type'] extends SqlNumber ? number : never,
    ): Node {
        return between(this.node, lower, upper)
    }

    /**
     * Matches pattern (LIKE).
     * @param pattern - SQL pattern with % and _ wildcards
     */
    like(pattern: TType['type'] extends 'TEXT' ? string : never): Node {
        return this.#comparison(like, pattern)
    }

    /**
     * Tests for membership in set (IN).
     * @param set - Array of values to test against
     */
    in(set: ColDataType<TType>[]): Node {
        return this.#comparison(in_, valueList(...set))
    }

    /**
     * Tests if value is null (IS NULL).
     */
    isNull(): Node {
        return isNull(this.node)
    }

    /**
     * Tests if value is not null (IS NOT NULL).
     */
    isNotNull(): Node {
        return isNotNull(this.node)
    }

    // -> Arithmetic operations

    /**
     * Adds value (+).
     * @param value - Value to add
     */
    add(value: TType['type'] extends SqlNumber ? number : never): Node {
        return add(this.node, val(value))
    }

    /**
     * Subtracts value (-).
     * @param value - Value to subtract
     */
    sub(value: TType['type'] extends SqlNumber ? number : never): Node {
        return sub(this.node, val(value))
    }

    /**
     * Multiplies by value (*).
     * @param value - Value to multiply with
     */
    mul(value: TType['type'] extends SqlNumber ? number : never): Node {
        return mul(this.node, val(value))
    }

    /**
     * Divides by value (/).
     * @param value - Value to divide by
     */
    div(value: TType['type'] extends SqlNumber ? number : never): Node {
        return div(this.node, val(value))
    }

    // -> Aggregate functions

    #aggregate(fn: (node: NodeArg) => Node, distinct_?: boolean): Node {
        const agg: Node = fn(this.node)
        return distinct_ ? distinct(agg) : agg
    }

    /**
     * Calculates average (AVG).
     * @param distinct - If true, averages distinct values only
     */
    avg(distinct?: boolean): Node {
        return this.#aggregate(avg, distinct)
    }

    /**
     * Counts rows (COUNT).
     * @param distinct - If true, counts distinct values only
     */
    count(distinct?: boolean): Node {
        return this.#aggregate(count, distinct)
    }

    /**
     * Finds maximum value (MAX).
     * @param distinct - If true, finds maximum of distinct values only
     */
    max(distinct?: boolean): Node {
        return this.#aggregate(max, distinct)
    }

    /**
     * Finds minimum value (MIN).
     * @param distinct - If true, finds minimum of distinct values only
     */
    min(distinct?: boolean): Node {
        return this.#aggregate(min, distinct)
    }

    /**
     * Calculates sum (SUM).
     * @param distinct - If true, sums distinct values only
     */
    sum(distinct?: boolean): Node {
        return this.#aggregate(sum, distinct)
    }

    // -> Misc.

    /**
     * Creates an alias (AS).
     * @param name - The new (alias) name
     */
    as(name: string): Node {
        return alias(this.node, id(name))
    }

    /**
     * Assigns a value to the column.
     * @param value - Param or expression to set as new value
     */
    set(value: NodeArg): Node {
        return assign(this.node, value)
    }
}
