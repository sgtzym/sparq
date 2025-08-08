import type { SqlParam, SqlString } from '~/core/sql.ts'
import {
    type Node,
    type NodeArg,
    ParameterReg,
    renderAST,
    toNode,
} from '~/core/node.ts'
import {
    from,
    groupBy,
    having,
    joinCross,
    joinInner,
    joinLeft,
    joinLeftOuter,
    limit,
    offset,
    onConflictAbort,
    onConflictFail,
    onConflictIgnore,
    onConflictNothing,
    onConflictReplace,
    onConflictRollback,
    onConflictUpdate,
    orderBy,
    returning,
    set,
    values,
    where,
} from '~/nodes/clauses.ts'
import { delete_, insert, select, update } from '~/nodes/statements.ts'
import { AssignmentNode, valueList } from '~/nodes/values.ts'
import { Column } from '~/api/column.ts'

// ---------------------------------------------
// Base statement builder
// ---------------------------------------------

abstract class SqlStatementBuilder {
    protected _clauses: Node[]
    protected _sql: SqlString
    protected _params: ParameterReg

    constructor() {
        this._clauses = []
        this._sql = ''
        this._params = new ParameterReg()
    }

    protected render() {
        this._sql = renderAST(this._clauses, this._params)
    }

    get sql(): SqlString {
        this.render()
        return this._sql
    }

    get params(): readonly SqlParam[] {
        this.render()
        return this._params.toArray()
    }

    /**
     * Pushed clause to tree, re-renders sql
     */
    protected addClause(clause: Node): this {
        this._clauses.push(clause)
        this.render()
        return this
    }
}

// ---------------------------------------------
// Capability mixins
// ---------------------------------------------

interface Where {
    /**
     * Creates a WHERE clause for data filtering.
     * @param conditions - The conditions to filter by
     */
    where(...conditions: NodeArg[]): this
}

interface OrderBy {
    /**
     * Creates a ORDER BY clause for data sorting.
     * @param columns - The columns to sort by
     */
    orderBy(...columns: NodeArg[]): this
}

interface Limit {
    /**
     * Creates a LIMIT clause for restricting result count.
     * Adds OFFSET capability.
     * @param count - The maximum number of rows to return
     */
    limit(count: NodeArg): this
}

interface Offset {
    /**
     * Creates an OFFSET clause for result pagination.
     * @param count - The number of rows to skip
     */
    offset(count: NodeArg): this
}

interface Join<T> {
    /**
     * Creates an INNER JOIN clause.
     * @param table - The table to join
     * @param condition - The optional join condition
     */
    inner(table: NodeArg, condition?: NodeArg): T

    /**
     * Creates a LEFT JOIN clause.
     * @param table - The table to join
     * @param condition - The optional join condition
     */
    left(table: NodeArg, condition?: NodeArg): T

    /**
     * Creates a LEFT OUTER JOIN clause.
     * @param table - The table to join
     * @param condition - The optional join condition
     */
    leftOuter(table: NodeArg, condition?: NodeArg): T

    /**
     * Creates a CROSS JOIN clause.
     * @param table - The table to join
     */
    cross(table: NodeArg): T
}

interface GroupBy {
    /**
     * Creates a GROUP BY clause for result aggregation.
     * Adds HAVING capability.
     * @param columns - The columns to group by
     */
    groupBy(...columns: NodeArg[]): this
}

interface Having {
    /**
     * Creates a HAVING clause for filtering grouped results.
     * @param conditions - The filter conditions for grouped data
     */
    having(...conditions: NodeArg[]): this
}

interface Returning {
    /**
     * Creates a RETURNING clause for retrieving affected row data.
     * @param columns - The columns to return from affected rows
     */
    returning(...columns: NodeArg[]): this
}

interface OnConflict<T> {
    /**
     * Handles conflicts by aborting the current statement.
     * @param targets - The optional conflict target columns or constraints
     */
    abort(...targets: NodeArg[]): T

    /**
     * Handles conflicts by failing the statement with an error.
     * @param targets - The optional conflict target columns or constraints
     */
    fail(...targets: NodeArg[]): T

    /**
     * Handles conflicts by ignoring the conflicting row.
     * @param targets - The optional conflict target columns or constraints
     */
    ignore(...targets: NodeArg[]): T

    /**
     * Handles conflicts by replacing the existing row.
     * @param targets - The optional conflict target columns or constraints
     */
    replace(...targets: NodeArg[]): T

    /**
     * Handles conflicts by rolling back the current transaction.
     * @param targets - The optional conflict target columns or constraints
     */
    rollback(...targets: NodeArg[]): T

    /**
     * Handles conflicts by doing nothing (skipping the row).
     * @param targets - The optional conflict target columns or constraints
     */
    nothing(...targets: NodeArg[]): T

    /**
     * Handles conflicts by updating the existing row with new values.
     * @param assignments - The column assignments for the update
     * @param targets - The optional conflict targets columns or constraints
     * @param conditions - The optional WHERE condition for the update
     */
    upsert(...assignments: NodeArg[]): T
}

// ---------------------------------------------
// Statement capabilities
// ---------------------------------------------

interface SelectCapabilities extends Where, GroupBy, OrderBy, Limit {
    /**
     * Provides table join operations for combining data from multiple tables.
     */
    join(table: NodeArg): Join<Select>
}

interface InsertCapabilities extends Where, Returning {
    /**
     * Specifies the values (row) to insert into the table.
     * Can be recalled for additional new rows.
     * @param args - The values to insert, corresponding to the specified columns
     */
    values(...args: NodeArg[]): this

    /**
     * Provides conflict resolution strategies for handling constraint violations during insertion.
     */
    conflict(...targets: NodeArg[]): OnConflict<Insert>
}

interface UpdateCapabilities extends Where, OrderBy, Limit, Returning {
    /**
     * Provides conflict resolution strategies for handling constraint violations during updates.
     */
    conflict(...targets: NodeArg[]): OnConflict<Update>
}

interface DeleteCapabilities extends Where, OrderBy, Limit, Returning {}

// ---------------------------------------------
// Statement builders
// ---------------------------------------------

export class Select extends SqlStatementBuilder implements SelectCapabilities {
    constructor(
        private readonly table: string,
        private readonly columns?: NodeArg[],
    ) {
        super()
        this.addClause(select(this.columns))
        this.addClause(from(this.table))
    }

    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
    }
    join(table: NodeArg): Join<Select> {
        return {
            inner: (condition?: NodeArg): this =>
                this.addClause(joinInner(table, condition)),
            left: (condition?: NodeArg): this =>
                this.addClause(joinLeft(table, condition)),
            leftOuter: (condition?: NodeArg): this =>
                this.addClause(joinLeftOuter(table, condition)),
            cross: (): this => this.addClause(joinCross(table)),
        }
    }
    groupBy(...columns: NodeArg[]): this {
        return this.addClause(groupBy(...columns))
    }
    having(...conditions: NodeArg[]): this {
        return this.addClause(having(...conditions))
    }
    orderBy(...columns: NodeArg[]): this {
        return this.addClause(orderBy(...columns))
    }
    limit(count: NodeArg): this {
        return this.addClause(limit(count))
    }
    offset(count: NodeArg): this {
        return this.addClause(offset(count))
    }
}

export class Insert extends SqlStatementBuilder implements InsertCapabilities {
    private readonly cols: Node[] = []
    private readonly _values = values()

    constructor(
        private readonly table: string,
        columns: NodeArg[],
    ) {
        super()

        for (const col of columns) {
            this.cols.push(col instanceof Column ? col.node : toNode(col))
        }

        this.addClause(insert(this.table, this.cols))
        this.addClause(this._values)
    }

    conflict(...targets: NodeArg[]): OnConflict<Insert> {
        return {
            abort: (): this => this.addClause(onConflictAbort(...targets)),
            fail: (): this => this.addClause(onConflictFail(...targets)),
            ignore: (): this => this.addClause(onConflictIgnore(...targets)),
            replace: (): this => this.addClause(onConflictReplace(...targets)),
            rollback: (): this =>
                this.addClause(onConflictRollback(...targets)),
            nothing: (): this => this.addClause(onConflictNothing(...targets)),
            upsert: (...assignments: NodeArg[]): this =>
                this.addClause(onConflictUpdate(assignments, targets)),
        }
    }
    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
    }
    values(...args: NodeArg[]): this {
        if (args.length !== this.cols.length) {
            throw new Error(
                `Insert requires ${this.cols.length} values. Received ${args.length}.`,
            )
        }

        this._values.addRow(valueList(...args))

        return this
    }
    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}

export class Update extends SqlStatementBuilder implements UpdateCapabilities {
    private readonly assignments: Node[] = []

    constructor(
        private readonly table: string,
        assignments: NodeArg[],
    ) {
        super()

        this.addClause(update(this.table))

        for (const assign of assignments) {
            if (assign instanceof AssignmentNode) {
                this.assignments.push(assign)
            }
        }

        this.addClause(set(...this.assignments))
    }

    orderBy(...columns: NodeArg[]): this {
        return this.addClause(orderBy(...columns))
    }
    limit(count: NodeArg): this {
        return this.addClause(limit(count))
    }
    offset(count: NodeArg): this {
        return this.addClause(offset(count))
    }
    conflict(...targets: NodeArg[]): OnConflict<Update> {
        return {
            abort: () => this.addClause(onConflictAbort(...targets)),
            fail: () => this.addClause(onConflictFail(...targets)),
            ignore: () => this.addClause(onConflictIgnore(...targets)),
            replace: () => this.addClause(onConflictReplace(...targets)),
            rollback: () => this.addClause(onConflictRollback(...targets)),
            nothing: () => this.addClause(onConflictNothing(...targets)),
            upsert: (...assignments: NodeArg[]): this =>
                this.addClause(onConflictUpdate(assignments, targets)),
        }
    }
    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
    }
    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}

export class Delete extends SqlStatementBuilder implements DeleteCapabilities {
    constructor(private readonly table: string) {
        super()
        this.addClause(delete_())
        this.addClause(from(this.table))
    }

    where(...conditions: NodeArg[]): this {
        return this.addClause(where(...conditions))
    }
    orderBy(...columns: NodeArg[]): this {
        return this.addClause(orderBy(...columns))
    }
    limit(count: NodeArg): this {
        return this.addClause(limit(count))
    }
    offset(count: NodeArg): this {
        return this.addClause(offset(count))
    }
    returning(...columns: NodeArg[]): this {
        return this.addClause(returning(...columns))
    }
}
