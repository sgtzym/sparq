import type { SqlNodeValue } from '~/core/sql-node.ts'
import * as clause from '~/nodes/clauses.ts'
import type { SqlQueryBuilder } from '~/api/query-builders.ts'

// ---------------------------------------------
// Clause mixins
// ---------------------------------------------

export class Filter<T extends SqlQueryBuilder = SqlQueryBuilder> {
    /** Filters rows by conditions. */
    where(this: T, ...conditions: SqlNodeValue[]): T {
        return this.add(clause.where(...conditions))
    }

    /** Sorts query results. */
    orderBy(this: T, ...columns: SqlNodeValue[]): T {
        return this.add(clause.orderBy(...columns))
    }

    limit(this: T, count: SqlNodeValue): T {
        return this.add(clause.limit(count))
    }

    /** Skips initial rows. */
    offset(this: T, count: SqlNodeValue): T {
        return this.add(clause.offset(count))
    }
}

export class Group<T extends SqlQueryBuilder = SqlQueryBuilder> {
    /** Groups rows for aggregation. */
    groupBy(this: T, ...columns: SqlNodeValue[]): T {
        return this.add(clause.groupBy(...columns))
    }

    /** Filters grouped results. */
    having(this: T, ...conditions: SqlNodeValue[]): T {
        return this.add(clause.having(...conditions))
    }
}

export class Return<T extends SqlQueryBuilder = SqlQueryBuilder> {
    /** Returns data from affected rows. */
    returning(this: T, ...columns: SqlNodeValue[]): T {
        return this.add(clause.returning(...columns))
    }
}

export class Join<T extends SqlQueryBuilder = SqlQueryBuilder> {
    join(this: T, table: SqlNodeValue) {
        const _table: SqlNodeValue = (table as any)?.table ?? table // duck-typed Sparq instance

        return {
            /** Joins tables with matching rows. */
            inner: (condition?: SqlNodeValue): T => this.add(clause.joinInner(_table, condition)),
            /** Joins tables keeping all left rows. */
            left: (condition?: SqlNodeValue): T => this.add(clause.joinLeft(_table, condition)),
            /** Joins tables keeping all left rows (outer). */
            leftOuter: (condition?: SqlNodeValue): T =>
                this.add(clause.joinLeftOuter(_table, condition)),
            /** Creates Cartesian product of tables. */
            cross: (): T => this.add(clause.joinCross(_table)),
        }
    }
}

export class Resolve<T extends SqlQueryBuilder = SqlQueryBuilder> {
    conflict(this: T, ...targets: SqlNodeValue[]) {
        return {
            /** Aborts on conflict. */
            abort: (): T => this.add(clause.onConflictAbort(...targets)),
            /** Fails on conflict. */
            fail: (): T => this.add(clause.onConflictFail(...targets)),
            /** Ignores on conflict. */
            ignore: (): T => this.add(clause.onConflictIgnore(...targets)),
            /** Replaces on conflict. */
            replace: (): T => this.add(clause.onConflictReplace(...targets)),
            /**  Rolls back on conflict. */
            rollback: (): T => this.add(clause.onConflictRollback(...targets)),
            /** Does nothing on conflict. */
            nothing: (): T => this.add(clause.onConflictNothing(...targets)),
            /**
             * Updates existing rows on conflict (upsert).
             *
             * @param - assignments - Column assignments for the update
             * @param - targets - Conflict target columns
             * @param - conditions - Optional WHERE conditions
             */
            upsert: (
                assignments: SqlNodeValue[],
                ...conditions: SqlNodeValue[]
            ): T =>
                this.add(
                    clause.onConflictUpdate(assignments, targets, conditions),
                ),
        }
    }
}
