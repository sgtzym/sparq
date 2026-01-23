import type { SqlNodeValue } from '~core'
import {
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
	where,
} from '~node'
import type { SqlQueryBuilder } from '~api'

// ---------------------------------------------
// Clause mixins
// ---------------------------------------------

export class Filter<T extends SqlQueryBuilder = SqlQueryBuilder> {
	/** Filters rows by conditions. */
	where(this: T, ...conditions: SqlNodeValue[]): T {
		return this.add(where(...conditions))
	}

	/** Sorts query results. */
	orderBy(this: T, ...columns: SqlNodeValue[]): T {
		return this.add(orderBy(...columns))
	}

	limit(this: T, count: SqlNodeValue): T {
		return this.add(limit(count))
	}

	/** Skips initial rows. */
	offset(this: T, count: SqlNodeValue): T {
		return this.add(offset(count))
	}
}

export class Group<T extends SqlQueryBuilder = SqlQueryBuilder> {
	/** Groups rows for aggregation. */
	groupBy(this: T, ...columns: SqlNodeValue[]): T {
		return this.add(groupBy(...columns))
	}

	/** Filters grouped results. */
	having(this: T, ...conditions: SqlNodeValue[]): T {
		return this.add(having(...conditions))
	}
}

export class Return<T extends SqlQueryBuilder = SqlQueryBuilder> {
	/** Returns data from affected rows. */
	returning(this: T, ...columns: SqlNodeValue[]): T {
		return this.add(returning(...columns))
	}
}

export class Join<T extends SqlQueryBuilder = SqlQueryBuilder> {
	join(this: T, table: SqlNodeValue): {
		inner: (condition?: SqlNodeValue) => T
		left: (condition?: SqlNodeValue) => T
		leftOuter: (condition?: SqlNodeValue) => T
		cross: () => T
	} {
		const _table: SqlNodeValue = (table as any)?.table ?? table // duck-typed Sparq instance

		return {
			/** Joins tables with matching rows. */
			inner: (condition?: SqlNodeValue): T => this.add(joinInner(_table, condition)),
			/** Joins tables keeping all left rows. */
			left: (condition?: SqlNodeValue): T => this.add(joinLeft(_table, condition)),
			/** Joins tables keeping all left rows (outer). */
			leftOuter: (condition?: SqlNodeValue): T => this.add(joinLeftOuter(_table, condition)),
			/** Creates Cartesian product of tables. */
			cross: (): T => this.add(joinCross(_table)),
		}
	}
}

export class Resolve<T extends SqlQueryBuilder = SqlQueryBuilder> {
	conflict(this: T, ...targets: SqlNodeValue[]): {
		abort: () => T
		fail: () => T
		ignore: () => T
		replace: () => T
		rollback: () => T
		nothing: () => T
		upsert: (assignments: SqlNodeValue[], ...conditions: SqlNodeValue[]) => T
	} {
		return {
			/** Aborts on conflict. */
			abort: (): T => this.add(onConflictAbort(...targets)),
			/** Fails on conflict. */
			fail: (): T => this.add(onConflictFail(...targets)),
			/** Ignores on conflict. */
			ignore: (): T => this.add(onConflictIgnore(...targets)),
			/** Replaces on conflict. */
			replace: (): T => this.add(onConflictReplace(...targets)),
			/**  Rolls back on conflict. */
			rollback: (): T => this.add(onConflictRollback(...targets)),
			/** Does nothing on conflict. */
			nothing: (): T => this.add(onConflictNothing(...targets)),
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
					onConflictUpdate(assignments, targets, conditions),
				),
		}
	}
}
