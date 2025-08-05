import type { ArrayLike } from '~/core/utils.ts'
import { needsQuoting, sql, type SqlString, toSqlParam } from '~/core/sql.ts'
import type { Parameters } from '~/core/parameter-registry.ts'
import { type Node, type Param, renderAll } from '~/core/node.ts'

// ---------------------------------------------
// 🧬 AST nodes: Primitives
// ---------------------------------------------

export class RawNode implements Node {
    constructor(
        private readonly sql: string,
    ) {}

    get priority(): number {
        return this
            .priority
    }

    render(
        _params: Parameters,
    ): SqlString {
        return this
            .sql
    }
}

export class LiteralNode implements Node {
    constructor(
        private readonly value: Param,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        return params
            .add(
                toSqlParam(
                    this.value,
                ),
            )
    }
}

export class IdentifierNode implements Node {
    constructor(
        private readonly name: string,
    ) {}

    render(
        _params: Parameters,
    ): SqlString {
        const sql: string = this.name
            .split(
                '.',
            )
            .map(
                (
                    part,
                ) => needsQuoting(
                        part,
                    )
                    ? `"${part}"`
                    : part,
            )
            .join(
                '.',
            )

        return sql
    }
}

// ---------------------------------------------
// 🧬 AST nodes: Operators
// ---------------------------------------------

export class ComparisonNode implements Node {
    constructor(
        private readonly left: Node,
        private readonly operator: Node,
        private readonly right: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const parts: string[] = renderAll(
            [
                this.left,
                this.operator,
                this.right,
            ],
            params,
        )

        return parts
            .join(
                ' ',
            )
    }
}

export class ConjunctionNode implements Node {
    constructor(
        private readonly operator: Node,
        private readonly conditions: ArrayLike<
            Node
        >,
        private readonly grouped: boolean = false,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const op: string = this.operator
            .render(
                params,
            )
        const conditions: string = renderAll(
            this.conditions,
            params,
        )
            .join(
                ` ${op} `,
            )

        return this
                .grouped
            ? `(${conditions})`
            : conditions
    }
}

export class ModifierNode implements Node {
    constructor(
        private readonly modifier: Node,
        private readonly operand: Node,
        private readonly position:
            | 'prefix'
            | 'suffix',
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const mod: string = this.modifier
            .render(
                params,
            )
        const op: string = this.operand
            .render(
                params,
            )

        return this
                .position ===
                'prefix'
            ? `${mod} ${op}`
            : `${op} ${mod}`
    }
}

// ---------------------------------------------
// 🧬 AST nodes: Values & Assignments
// ---------------------------------------------

export class AssignmentNode implements Node {
    constructor(
        private readonly column: Node,
        private readonly value: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const col: string = this.column
            .render(
                params,
            )
        const val: string = this.value
            .render(
                params,
            )

        return `${col} = ${val}`
    }
}

export class ValueListNode implements Node {
    constructor(
        private readonly values: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const values: string = renderAll(
            this.values,
            params,
        )
            .join(
                ', ',
            )

        return `(${values})`
    }
}

// ---------------------------------------------
// 🧬 AST nodes: Modifiers
// ---------------------------------------------

export class AliasNode implements Node {
    constructor(
        private readonly expr: Node,
        private readonly alias: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const expr: string = this.expr
            .render(
                params,
            )
        const alias: string = this.alias
            .render(
                params,
            )

        return `${expr} ${sql('AS')} ${alias}`
    }
}

export class SetQuantifierNode implements Node {
    constructor(
        private readonly quantifier: Node,
        private readonly expr?: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const quantifier: string = this.quantifier
            .render(
                params,
            )
        const expr: string = this.expr
            ?.render(
                params,
            )

        return this
                .expr
            ? `${quantifier} ${expr}`
            : quantifier
    }
}

export class SortingDirectionNode implements Node {
    constructor(
        private readonly expr: Node,
        private readonly dir: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const expr: string = this.expr
            .render(
                params,
            )
        const dir: string = this.dir
            .render(
                params,
            )

        return `${expr} ${dir}`
    }
}

// ---------------------------------------------
// 🧬 AST nodes: Aggregates
// ---------------------------------------------

export class AggregateNode implements Node {
    constructor(
        private readonly fn: Node,
        private readonly expr?: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const fn: string = this.fn
            .render(
                params,
            )
        const expr: string = this.expr
            ?.render(
                params,
            )

        return this
                .expr
            ? `${fn}(${expr})`
            : `${fn}(*)`
    }
}

// ---------------------------------------------
// 🧬 AST nodes: Clauses
// ---------------------------------------------

export class FromNode implements Node {
    readonly priority: number = 10

    constructor(
        private readonly tables: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const tables: string = renderAll(
            this.tables,
            params,
        )
            .join(
                ', ',
            )

        return `${sql('FROM')} ${tables}`
    }
}

export class JoinNode implements Node {
    readonly priority: number = 20

    constructor(
        private readonly joinType: Node,
        private readonly table: Node,
        private readonly condition?: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const type: string = this.joinType
            .render(
                params,
            )
        const table: string = this.table
            .render(
                params,
            )
        const condition: string = this.condition
            ?.render(
                params,
            )

        return condition
            ? `${type} ${sql('JOIN')} ${table} ${sql('ON')} ${condition}`
            : `${type} ${sql('JOIN')} ${table}`
    }
}

export class WhereNode implements Node {
    readonly priority: number = 30

    constructor(
        private readonly conditions: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const conditions: string = renderAll(
            this.conditions,
            params,
        )
            .join(
                ` ${sql('AND')} `,
            )

        return `${sql('WHERE')} ${conditions}`
    }
}

export class GroupByNode implements Node {
    readonly priority: number = 40

    constructor(
        private readonly expr: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const expr: string = renderAll(
            this.expr,
            params,
        ).join(
            ', ',
        )

        return `${sql('GROUP')} ${sql('BY')} ${expr}`
    }
}

export class HavingNode implements Node {
    readonly priority: number = 50

    constructor(
        private readonly conditions: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const conditions: string = renderAll(
            this.conditions,
            params,
        )
            .join(
                ` ${sql('AND')} `,
            )

        return `${sql('HAVING')} ${conditions}`
    }
}

export class OrderByNode implements Node {
    readonly priority: number = 60

    constructor(
        private readonly expr: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const expr: string = renderAll(
            this.expr,
            params,
        ).join(
            ', ',
        )

        return `${sql('ORDER')} ${sql('BY')} ${expr}`
    }
}

export class LimitNode implements Node {
    readonly priority: number = 70

    constructor(
        private readonly count: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const count: string = this.count
            .render(
                params,
            )

        return `${sql('LIMIT')} ${count}`
    }
}

export class OffsetNode implements Node {
    readonly priority: number = 80

    constructor(
        private readonly count: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const count: string = this.count
            .render(
                params,
            )

        return `${sql('OFFSET')} ${count}`
    }
}

export class ValuesNode implements Node {
    constructor(
        private readonly rows: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const rows: string = renderAll(
            this.rows,
            params,
        )
            .join(
                ', ',
            )

        return `${sql('VALUES')} ${rows};`
    }
}

export class SetNode implements Node {
    constructor(
        private readonly assignments: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const assignments: string = renderAll(
            this.assignments,
            params,
        )
            .join(
                ', ',
            )

        return `${sql('SET')} ${assignments};`
    }
}

// ---------------------------------------------
// 🧬 AST nodes: Statements
// ---------------------------------------------

export class SelectNode implements Node {
    readonly priority: number = 0

    constructor(
        private readonly columns?: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const cols: string = this.columns &&
                (Array
                    .isArray(
                        this.columns,
                    ) &&
                    this.columns
                        .length)
            ? renderAll(
                this.columns,
                params,
            ).join(
                ', ',
            )
            : '*'

        return `${sql('SELECT')} ${cols}`
    }
}

export class InsertNode implements Node {
    constructor(
        private readonly table: Node,
        private readonly columns: ArrayLike<
            Node
        >,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const table: string = this.table
            .render(
                params,
            )
        const cols: string = renderAll(
            this.columns,
            params,
        ).join(
            ', ',
        )

        return `${sql('INSERT')} ${sql('INTO')} ${table} (${cols})`
    }
}

export class UpdateNode implements Node {
    constructor(
        private readonly table: Node,
    ) {}

    render(
        params: Parameters,
    ): SqlString {
        const table: string = this.table
            .render(
                params,
            )

        return `${sql('UPDATE')} ${table}`
    }
}

export class DeleteNode implements Node {
    render(
        _params: Parameters,
    ): SqlString {
        return sql(
            'DELETE',
        )
    }
}
