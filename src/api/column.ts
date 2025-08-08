import {
    isNode,
    type Node,
    type NodeConvertible,
    type Param,
} from '~/core/node.ts'
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

/**
 * Represents a database column with type-safe operations.
 * Provides methods for SQL comparisons, aggregates, and transformations.
 */
export class Column<TName extends string = string, TType extends Param = Param>
    implements NodeConvertible {
    constructor(
        private readonly _name: TName,
        private readonly _type?: TType,
    ) {}

    get name(): string {
        return this._name
    }

    get node(): Node {
        return id(this.name) // lazy init
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

    // -> Comparison operations

    /**
     * Tests for equality (=).
     * @param value - Value to test against
     */
    eq(value: TType): Node {
        return eq(this.node, val(value))
    }

    /**
     * Tests for inequality (!=).
     * @param value - Value to test against
     */
    ne(value: TType): Node {
        return ne(this.node, val(value))
    }

    /**
     * Tests if greater than (>).
     * @param value - Value to test against
     */
    gt(value: TType extends number | bigint | Date ? TType : never): Node {
        return gt(this.node, val(value))
    }

    /**
     * Tests if less than (<).
     * @param value - Value to test against
     */
    lt(value: TType extends number | bigint | Date ? TType : never): Node {
        return lt(this.node, val(value))
    }

    /**
     * Tests if greater than or equal to (>=).
     * @param value - Value to test against
     */
    ge(value: TType extends number | bigint | Date ? TType : never): Node {
        return ge(this.node, val(value))
    }

    /**
     * Tests if less than or equal to (<=).
     * @param value - Value to test against
     */
    le(value: TType extends number | bigint | Date ? TType : never): Node {
        return le(this.node, val(value))
    }

    /**
     * Tests if value is within range (BETWEEN).
     * @param lower - Lower bound (inclusive)
     * @param upper - Upper bound (inclusive)
     */
    between<T extends TType & (number | bigint | Date)>(
        lower: T,
        upper: T,
    ): Node {
        return between(this.node, lower, upper)
    }

    /**
     * Matches pattern (LIKE).
     * @param pattern - SQL pattern with % and _ wildcards
     */
    like(pattern: TType extends string ? string : never): Node {
        return like(this.node, val(pattern))
    }

    /**
     * Tests for membership in set (IN).
     * @param values - Array of values to test against
     */
    in(values: TType[]): Node {
        return in_(this.node, valueList(...values))
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

    /**
     * Creates an alias (AS).
     * @param asName - The new (alias) name
     */
    as(asName: string): Node {
        return alias(this.node, id(asName))
    }

    /** s
     * Assigns a value to the column.
     * @param value - Param or expression to set as new value
     */
    set(value: TType | Node): Node {
        return assign(this.node, isNode(value) ? value : val(value))
    }

    // -> Arithmetic operations

    /**
     * Adds value (+).
     * @param value - Value to add
     */
    add(value: TType extends number | bigint ? TType : never): Node {
        return add(this.node, val(value))
    }

    /**
     * Subtracts value (-).
     * @param value - Value to subtract
     */
    sub(value: TType extends number | bigint ? TType : never): Node {
        return sub(this.node, val(value))
    }

    /**
     * Multiplies by value (*).
     * @param value - Value to multiply with
     */
    mul(value: TType extends number | bigint ? TType : never): Node {
        return mul(this.node, val(value))
    }

    /**
     * Divides by value (/).
     * @param value - Value to divide by
     */
    div(value: TType extends number | bigint ? TType : never): Node {
        return div(this.node, val(value))
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

    // -> Aggregate functions

    /**
     * Calculates average (AVG).
     */
    avg(): Node {
        return avg(this.node)
    }

    /**
     * Counts rows (COUNT).
     */
    count(): Node {
        return count(this.node)
    }

    /**
     * Finds maximum value (MAX).
     */
    max(): Node {
        return max(this.node)
    }

    /**
     * Finds minimum value (MIN).
     */
    min(): Node {
        return min(this.node)
    }

    /**
     * Calculates sum (SUM).
     */
    sum(): Node {
        return sum(this.node)
    }
}
