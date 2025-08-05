import { isSqlValue, sql } from '~/core/sql.ts'
import { type Node, type NodeArg, type Param, toNode } from '~/core/node.ts'
import * as ast from '~/ast-nodes.ts'

// ---------------------------------------------
// 🏭 Factories: Primitives
// ---------------------------------------------

export const id = (name: string): Node => {
    return new ast.IdentifierNode(name)
}

export const val = (value: Param): Node => {
    if (!isSqlValue(value)) {
        throw new Error(`${value} is not a valid SQL value`)
    }
    return new ast.LiteralNode(value)
}

export const raw = (sql: string): Node => {
    return new ast.RawNode(sql)
}

// ---------------------------------------------
// 🏭 Factories: Operators
// ---------------------------------------------

// Comparison operators (=, !=, ...)
const comparison = (op: string) => (left: NodeArg, right: NodeArg): Node =>
    new ast.ComparisonNode(toNode(left), raw(op), toNode(right))

export const eq = comparison('=')
export const ne = comparison('!=')
export const gt = comparison('>')
export const lt = comparison('<')
export const ge = comparison('>=')
export const le = comparison('<=')
export const like = comparison(sql('LIKE'))
export const in_ = comparison(sql('IN'))

export const between = (
    test: NodeArg,
    lower: NodeArg,
    upper: NodeArg,
): Node =>
    new ast.ComparisonNode(
        toNode(test),
        raw(sql('BETWEEN')),
        new ast.ConjunctionNode(
            raw(sql('AND')),
            [
                toNode(lower),
                toNode(upper),
            ],
        ),
    )

// Conjunction operators (AND, OR)
const conjunction =
    (op: string, grouped = false) => (...conditions: NodeArg[]): Node =>
        new ast.ConjunctionNode(raw(op), conditions.map(toNode), grouped)

export const and = conjunction(sql('AND'), true)
export const or = conjunction(sql('OR'), true)

// Modifier operators (NOT, EXISTS, ...)
const modifier =
    (op: string, position: 'prefix' | 'suffix') => (operand: NodeArg): Node =>
        new ast.ModifierNode(raw(op), toNode(operand), position)

export const not = modifier(sql('NOT'), 'prefix')
export const exists = modifier(sql('EXISTS'), 'prefix')
export const isNull = modifier(`${sql('IS')} ${sql('NULL')}`, 'suffix')
export const isNotNull = modifier(
    `${sql('IS')} ${sql('NOT')} ${sql('NULL')}`,
    'suffix',
)

// ---------------------------------------------
// 🏭 Factories: Values & Assignments
// ---------------------------------------------

export const assign = (column: NodeArg, value: NodeArg): Node => {
    return new ast.AssignmentNode(
        toNode(column),
        toNode(value),
    )
}

export const valueList = (...values: NodeArg[]): Node => {
    return new ast.ValueListNode(values.map(toNode))
}

// ---------------------------------------------
// 🏭 Factories: Modifiers
// ---------------------------------------------

// Set quantifiers
const quantifier = (q: string) => (expr?: NodeArg): Node =>
    new ast.SetQuantifierNode(raw(q), expr ? toNode(expr) : undefined)

export const distinct = quantifier(sql('DISTINCT'))
export const all = quantifier(sql('ALL'))

// Sorting directions
const sortDir = (dir: string) => (expr: NodeArg): Node => {
    if (!expr) throw new Error('Sorting direction requires an expr')
    return new ast.SortingDirectionNode(toNode(expr), raw(dir))
}

export const asc = sortDir(sql('ASC'))
export const desc = sortDir(sql('DESC'))

// Alias
export const alias = (expr: NodeArg, as: NodeArg): Node => {
    if (!expr || !as) {
        throw new Error('Alias requires both expr and name')
    }
    return new ast.AliasNode(toNode(expr), toNode(as))
}

// ---------------------------------------------
// 🏭 Factories: Aggregates
// ---------------------------------------------

const aggregate = (fn: string) => (expr?: NodeArg): Node =>
    new ast.AggregateNode(raw(fn), expr ? toNode(expr) : undefined)

export const avg = aggregate(sql('AVG'))

export const count = aggregate(sql('COUNT'))

export const max = aggregate(sql('MAX'))

export const min = aggregate(sql('MIN'))

export const sum = aggregate(sql('SUM'))

// ---------------------------------------------
// 🏭 Factories: Clauses
// ---------------------------------------------

//Basic clauses
export const from = (...tables: NodeArg[]) =>
    new ast.FromNode(
        tables.map((table) =>
            typeof table === 'string' ? id(table) : toNode(table)
        ),
    )

export const where = (...conditions: NodeArg[]) =>
    new ast.WhereNode(conditions.map(toNode))

export const groupBy = (...columns: NodeArg[]) =>
    new ast.GroupByNode(
        columns.map((col) => typeof col === 'string' ? id(col) : toNode(col)),
    )

export const having = (...conditions: NodeArg[]) =>
    new ast.HavingNode(conditions.map(toNode))

export const orderBy = (...columns: NodeArg[]) =>
    new ast.OrderByNode(
        columns.map((col) => typeof col === 'string' ? id(col) : toNode(col)),
    )

export const limit = (count: NodeArg) => new ast.LimitNode(toNode(count))

export const offset = (count: NodeArg) => new ast.OffsetNode(toNode(count))

// Joins
const join = (type: string) => (table: NodeArg, condition?: NodeArg): Node =>
    new ast.JoinNode(
        raw(type),
        toNode(table),
        condition ? toNode(condition) : undefined,
    )

export const joinInner = join(sql('INNER'))
export const joinLeft = join(sql('LEFT'))
export const joinLeftOuter = join(`${sql('LEFT')} ${sql('OUTER')}`)
export const joinCross = (table: NodeArg) =>
    new ast.JoinNode(raw(sql('CROSS')), toNode(table))

// ---------------------------------------------
// 🏭 Factories: Statements
// ---------------------------------------------

export const select = (columns?: NodeArg[]): Node =>
    new ast.SelectNode(
        columns.map((col) => typeof col === 'string' ? id(col) : toNode(col)),
    )

export const update = (table: NodeArg): Node =>
    new ast.UpdateNode(toNode(table))

export const insert = (table: NodeArg, columns: NodeArg[]): Node =>
    new ast.InsertNode(toNode(table), columns.map(toNode))

export const delete_ = (): Node => new ast.DeleteNode()
