// deno-fmt-ignore-file
import { applyMixins } from '~/core/mixins.ts'
import { needsQuoting } from '~/core/sql.ts'
import type { ParameterReg } from '~/core/param-registry.ts'
import { SqlNode, type SqlParam } from '~/core/sql-node.ts'
import * as mix from '~/api/mixins-column.ts'

// ---------------------------------------------
// Column API
// ---------------------------------------------

/**
 * Base column class with common SQL operations.
 * Provides core functionality available to all column types including
 * comparisons, null checks, aliasing, and basic aggregates.
 */
export class Column<
    TName extends string = string,
    TType extends SqlParam = SqlParam,
> extends SqlNode {
    protected _node?: SqlNode // Store expr/node for chaining

    constructor(
        protected readonly _name: TName,
        protected readonly _table?: string, // Opt. table ref.
        protected readonly _type?: TType,
    ) {
        super()
    }

    render(params: ParameterReg): string {
        if (this._node) {
            return this._node.render(params)
        }

        const identifier = this._table ? `${this._table}.${this._name}` : this._name

        return identifier.split('.')
            .map((p) => needsQuoting(p) ? `"${p}"` : p)
            .join('.')
    }

    /**
     * Creates a new column instance wrapping the given node.
     * Immutable chaining: Preserves the column's metadata for method chaining.
     */
    protected wrap<T extends Column<TName, TType>>(node: SqlNode): T {
        // Copies the original constructor and just replaces _node.
        const wrapped = Object.assign(Object.create(Object.getPrototypeOf(this)), this) as T
        wrapped._node = node
        return wrapped
    }
}

export class NumberColumn<TName extends string = string> extends Column<TName, number> {}
export class TextColumn<TName extends string = string> extends Column<TName, string> {}
export class DateTimeColumn<TName extends string = string> extends Column<TName, Date | string> {}
export class BooleanColumn<TName extends string = string> extends Column<TName, boolean> {}

applyMixins(Column, [
    mix.Aggregate,
    mix.Alias,
    mix.Assign,
    mix.FilterByEquality,
    mix.FilterByInclusion,
    mix.FilterByNull,
    mix.Quantify,
    mix.Sort,
])

applyMixins(NumberColumn, [
    mix.AggregateArithmetic,
    mix.ComputeByArithmetic,
    mix.ComputeByMath,
    mix.FilterByComparison,
])

applyMixins(TextColumn, [
    mix.FilterByTextPattern,
    mix.TransformText,
])

applyMixins(DateTimeColumn, [
    mix.ExtractDate,
    mix.FilterByComparison,
    mix.FormatDate,
])

export interface Column extends
    mix.Aggregate<Column>,
    mix.Alias<Column>,
    mix.Assign<Column>,
    mix.FilterByEquality<Column>,
    mix.FilterByInclusion<Column>,
    mix.FilterByNull<Column>,
    mix.Quantify<Column>,
    mix.Sort<Column> {}

export interface NumberColumn extends
    mix.AggregateArithmetic<NumberColumn>,
    mix.ComputeByArithmetic<NumberColumn>,
    mix.ComputeByMath<NumberColumn>,
    mix.FilterByComparison<NumberColumn> {}

export interface TextColumn extends
    mix.FilterByTextPattern<TextColumn>,
    mix.TransformText<TextColumn> {}

export interface DateTimeColumn extends
    mix.ExtractDate<DateTimeColumn>,
    mix.FilterByComparison<DateTimeColumn>,
    mix.FormatDate<DateTimeColumn> {}

export type ColumnTypeMapping<K extends string, T extends SqlParam> = T extends number ? NumberColumn<K>
    : T extends string ? TextColumn<K>
    : T extends Date ? DateTimeColumn<K>
    : T extends boolean ? BooleanColumn<K>
    : T extends Record<string, any> ? Column<K, T> // Fallback for JSON
    : T extends Uint8Array ? Column<K, T>
    : T extends null ? Column<K, T>
    : Column<K, T>

/**
 * Column type factories for schema definition.
 *
 * @example
 * ```ts
 * const users = sparq('users', {
 *   id: SqlType.number(),
 *   name: SqlType.text(),
 *   active: SqlType.boolean(),
 *   createdAt: SqlType.date()
 * })
 * ```
 */
export const SqlType = {
    number: (): number => 0,
    text: (): string => '',
    boolean: (): boolean => true,
    date: (): Date => new Date(),
    list: (): Uint8Array | null => null,
    json: (): Record<string, any> | undefined => undefined,
} as const
