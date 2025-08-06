import type { ArrayLike } from '~/core/utils.ts'
import { needsQuoting, sql, type SqlString, toSqlParam } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { type Node, type Param, renderAll } from '~/core/node.ts'

// ---------------------------------------------
// 🧬 Primitives
// ---------------------------------------------

/**
 * Represents a raw SQL string.
 */
export class RawNode implements Node {
    constructor(private readonly sql: string) {}

    get priority(): number {
        return this.priority
    }

    render(_params: Parameters): SqlString {
        return this.sql
    }
}

/**
 * Represents a literal value with automatic parameterisation.
 */
export class LiteralNode implements Node {
    constructor(private readonly value: Param) {}

    render(params: Parameters): SqlString {
        return params.add(toSqlParam(this.value))
    }
}

/**
 * Represents an identifier (table/column name) with automatic quoting.
 */
export class IdentifierNode implements Node {
    constructor(private readonly name: string) {}

    render(_params: Parameters): SqlString {
        const sql: string = this.name
            .split('.')
            .map((part) => (needsQuoting(part) ? `"${part}"` : part))
            .join('.')

        return sql
    }
}

// ---------------------------------------------
// 🧬 Operators
// ---------------------------------------------

/**
 * Represents a unary operation with configurable positioning (A x).
 */
export class UnaryNode implements Node {
    constructor(
        private readonly operator: Node,
        private readonly expr?: Node,
        private readonly position: 'pfx' | 'sfx' = 'sfx',
    ) {}

    render(params: Parameters): SqlString {
        const op: string = this.operator.render(params)
        const expr: string = this.expr?.render(params)

        return this.expr
            ? this.position === 'pfx' ? `${op} ${expr}` : `${expr} ${op}`
            : op
    }
}

/**
 * Represents a binary operation (A x B).
 */
export class BinaryNode implements Node {
    constructor(
        private readonly left: Node,
        private readonly operator: Node,
        private readonly right: Node,
    ) {}

    render(params: Parameters): SqlString {
        const left: string = this.left.render(params)
        const op: string = this.operator.render(params)
        const right: string = this.right.render(params)

        return `${left} ${op} ${right}`
    }
}

/**
 * Represents a conjunction operation (A and/or B).
 */
export class ConjunctionNode implements Node {
    constructor(
        private readonly operator: Node,
        private readonly conditions: ArrayLike<Node>,
        private readonly grouped: boolean = false,
    ) {}

    render(params: Parameters): SqlString {
        const op: string = this.operator.render(params)
        const conditions: string = renderAll(this.conditions, params).join(
            ` ${op} `,
        )

        return this.grouped ? `(${conditions})` : conditions
    }
}

// ---------------------------------------------
// 🧬 Values / Assignments
// ---------------------------------------------

/**
 * Represents a column assignment for data modification.
 */
export class AssignmentNode implements Node {
    constructor(
        private readonly column: Node,
        private readonly value: Node,
    ) {}

    render(params: Parameters): SqlString {
        const col: string = this.column.render(params)
        const val: string = this.value.render(params)

        return `${col} = ${val}`
    }
}

/**
 * Represents a value list / single row for data creation.
 */
export class ValueListNode implements Node {
    constructor(private readonly values: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const values: string = renderAll(this.values, params).join(', ')

        return `(${values})`
    }
}

// ---------------------------------------------
// 🧬 Aggregate Functions
// ---------------------------------------------

/**
 * Represents an aggregate function with optional expression.
 */
export class AggregateNode implements Node {
    constructor(
        private readonly fn: Node,
        private readonly expr?: Node,
    ) {}

    render(params: Parameters): SqlString {
        const fn: string = this.fn.render(params)
        const expr: string = this.expr?.render(params)

        return this.expr ? `${fn}(${expr})` : `${fn}(*)`
    }
}

// ---------------------------------------------
// 🧬 Clauses
// ---------------------------------------------

/**
 * Represents a FROM clause with table references.
 */
export class FromNode implements Node {
    readonly priority: number = 10

    constructor(private readonly tables: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const tables: string = renderAll(this.tables, params).join(', ')

        return `${sql('FROM')} ${tables}`
    }
}

/**
 * Represents a JOIN clause with optional conditions.
 */
export class JoinNode implements Node {
    readonly priority: number = 20

    constructor(
        private readonly joinType: Node,
        private readonly table: Node,
        private readonly condition?: Node,
    ) {}

    render(params: Parameters): SqlString {
        const type: string = this.joinType.render(params)
        const table: string = this.table.render(params)
        const condition: string = this.condition?.render(params)

        return condition
            ? `${type} ${sql('JOIN')} ${table} ${sql('ON')} ${condition}`
            : `${type} ${sql('JOIN')} ${table}`
    }
}

/**
 * Represents a WHERE clause for filtering rows.
 */
export class WhereNode implements Node {
    readonly priority: number = 30

    constructor(private readonly conditions: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const conditions: string = renderAll(this.conditions, params).join(
            ` ${sql('AND')} `,
        )

        return `${sql('WHERE')} ${conditions}`
    }
}

/**
 * Represents a GROUP BY clause for result aggregation.
 */
export class GroupByNode implements Node {
    readonly priority: number = 40

    constructor(private readonly expr: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const expr: string = renderAll(this.expr, params).join(', ')

        return `${sql('GROUP')} ${sql('BY')} ${expr}`
    }
}

/**
 * Represents a HAVING clause for filtering grouped results.
 */
export class HavingNode implements Node {
    readonly priority: number = 50

    constructor(private readonly conditions: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const conditions: string = renderAll(this.conditions, params).join(
            ` ${sql('AND')} `,
        )

        return `${sql('HAVING')} ${conditions}`
    }
}

/**
 * Represents an ORDER BY clause for sorting results.
 */
export class OrderByNode implements Node {
    readonly priority: number = 60

    constructor(private readonly expr: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const expr: string = renderAll(this.expr, params).join(', ')

        return `${sql('ORDER')} ${sql('BY')} ${expr}`
    }
}

/**
 * Represents a LIMIT clause for restricting result count.
 */
export class LimitNode implements Node {
    readonly priority: number = 70

    constructor(private readonly count: Node) {}

    render(params: Parameters): SqlString {
        const count: string = this.count.render(params)

        return `${sql('LIMIT')} ${count}`
    }
}

/**
 * Represents an OFFSET clause for result pagination.
 */
export class OffsetNode implements Node {
    readonly priority: number = 80

    constructor(private readonly count: Node) {}

    render(params: Parameters): SqlString {
        const count: string = this.count.render(params)

        return `${sql('OFFSET')} ${count}`
    }
}

/**
 * Represents a RETURNING clause for getting affected row data.
 */
export class ReturningNode implements Node {
    readonly priority = 90

    constructor(private readonly columns: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const cols = renderAll(this.columns, params).join(', ')
        return `${sql('RETURNING')} ${cols}`
    }
}

/**
 * Represents a VALUES clause for explicit row data.
 */
export class ValuesNode implements Node {
    constructor(private readonly rows: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const rows: string = renderAll(this.rows, params).join(', ')

        return `${sql('VALUES')} ${rows};`
    }
}

/**
 * Represents a SET clause for UPDATE operations.
 */
export class SetNode implements Node {
    readonly priority: number = 5

    constructor(private readonly assignments: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const assignments: string = renderAll(this.assignments, params).join(
            ', ',
        )

        return `${sql('SET')} ${assignments};`
    }
}

// ---------------------------------------------
// 🧬 Statements
// ---------------------------------------------

/**
 * Represents a SELECT statement with optional column specification.
 */
export class SelectNode implements Node {
    readonly priority: number = 0

    constructor(private readonly columns?: ArrayLike<Node>) {}

    render(params: Parameters): SqlString {
        const cols: string =
            this.columns && Array.isArray(this.columns) && this.columns.length
                ? renderAll(this.columns, params).join(', ')
                : '*'

        return `${sql('SELECT')} ${cols}`
    }
}

/**
 * Represents an INSERT statement for adding new rows.
 */
export class InsertNode implements Node {
    readonly priority: number = 0

    constructor(
        private readonly table: Node,
        private readonly columns: ArrayLike<Node>,
    ) {}

    render(params: Parameters): SqlString {
        const table: string = this.table.render(params)
        const cols: string = renderAll(this.columns, params).join(', ')

        return `${sql('INSERT')} ${sql('INTO')} ${table} (${cols})`
    }
}

/**
 * Represents an UPDATE statement for modifying existing rows.
 */
export class UpdateNode implements Node {
    readonly priority: number = 0

    constructor(private readonly table: Node) {}

    render(params: Parameters): SqlString {
        const table: string = this.table.render(params)

        return `${sql('UPDATE')} ${table}`
    }
}

/**
 * Represents a DELETE statement for removing rows.
 */
export class DeleteNode implements Node {
    readonly priority: number = 0

    render(_params: Parameters): SqlString {
        return sql('DELETE')
    }
}
