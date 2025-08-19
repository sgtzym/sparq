
## src/core/utils.ts

```typescript
/**
 * Converts a single value or array into an array format.
 * 
 * @param value - The value or array to convert
 * @returns An array containing the value(s)
 * 
 * @example
 * ```ts
 * castArray('hello')     // ['hello']
 * castArray([1, 2, 3])   // [1, 2, 3]
 * ```
 */
export function castArray<T>(value: ArrayLike<T>): T[]

/**
 * Checks if a value is defined (not null or undefined).
 * 
 * @param value - The value to check
 * @returns True if the value is defined, false otherwise
 * 
 * @example
 * ```ts
 * isDefined('hello')    // true
 * isDefined(null)       // false
 * isDefined(undefined)  // false
 * ```
 */
export function isDefined<T>(value: Maybe<T>): value is T
```

## src/core/sql.ts

```typescript
/**
 * Checks if an identifier needs to be quoted in SQL.
 * 
 * @param value - The identifier to check
 * @returns True if the identifier needs quoting
 * 
 * @example
 * ```ts
 * needsQuoting('user')      // false
 * needsQuoting('user-id')   // true (contains dash)
 * needsQuoting('SELECT')    // true (reserved keyword)
 * ```
 */
export function needsQuoting(value: string): boolean

/**
 * Checks if a value is a reserved SQL keyword.
 * 
 * @param value - The value to check
 * @returns True if the value is a reserved keyword
 * 
 * @example
 * ```ts
 * isSqlKeyword('SELECT')  // true
 * isSqlKeyword('user')    // false
 * ```
 */
export function isSqlKeyword(value: string): boolean

/**
 * Checks if a value is a valid SQL data type.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid SQL data type
 * 
 * @example
 * ```ts
 * isSqlDataType('hello')     // true
 * isSqlDataType(123)         // true
 * isSqlDataType(new Date())  // false
 * ```
 */
export function isSqlDataType(value: unknown): value is SqlDataType

/**
 * Converts any value to a valid SQL data type for parameterization.
 * 
 * @param value - The value to convert
 * @returns The value as a SQL-compatible data type
 * 
 * @example
 * ```ts
 * toSqlDataType(true)           // 1
 * toSqlDataType(false)          // 0
 * toSqlDataType(new Date())     // "2024-01-01T12:00:00.000Z"
 * toSqlDataType(undefined)      // null
 * ```
 */
export function toSqlDataType(value: unknown): SqlDataType

/**
 * Creates a SQL snippet from keywords and strings.
 * 
 * @param parts - The SQL keywords or strings to join
 * @returns A properly formatted SQL string
 * 
 * @example
 * ```ts
 * sql('SELECT', 'FROM', 'users')  // "SELECT FROM users"
 * ```
 */
export function sql(...parts: SqlSnippet[]): string
```

## src/core/param-registry.ts

```typescript
/**
 * Manages SQL query parameters with deduplication and formatting.
 * Supports both named and positional parameter styles.
 * 
 * @example
 * ```ts
 * const params = new ParameterReg()
 * params.add('John')     // Returns ':p1'
 * params.add('John')     // Returns ':p1' (deduplicated)
 * params.add('Jane')     // Returns ':p2'
 * params.toArray()       // ['John', 'Jane']
 * ```
 */
export class ParameterReg {
  constructor(options: ParameterRegOptions = {})

  /**
   * Raises the column to the specified power.
   * 
   * @param exponent - The exponent value
   * @returns The column with POWER function applied
   * 
   * @example
   * ```ts
   * user.level.pow(2)  // POWER(user.level, 2)
   * ```
   */
  pow(exponent: ColumnValue<number>): this

  /**
   * Calculates the column as a percentage of a total.
   * 
   * @param total - The total value to calculate percentage against
   * @returns The column with percentage calculation applied
   * 
   * @example
   * ```ts
   * user.score.percent(1000)  // user.score / 1000 * 100
   * ```
   */
  percent(total: ColumnValue<number>): this

  /**
   * Calculates the average value of the column.
   * 
   * @returns The column with AVG function applied
   * 
   * @example
   * ```ts
   * user.score.avg()  // AVG(user.score)
   * ```
   */
  avg(): this

  /**
   * Calculates the sum of values in the column.
   * 
   * @returns The column with SUM function applied
   * 
   * @example
   * ```ts
   * order.total.sum()  // SUM(order.total)
   * ```
   */
  sum(): this
}

/**
 * Interface for text columns with string-specific operations.
 */
export interface ITextColumn<TName extends string = string>
  extends IColumn<TName, string> {
  /**
   * Creates a LIKE pattern matching comparison.
   * 
   * @param pattern - The pattern to match (use % for any characters, _ for single character)
   * @returns A SQL pattern matching node
   * 
   * @example
   * ```ts
   * user.name.like('%John%')  // user.name LIKE '%John%'
   * ```
   */
  like(pattern: ColumnValue<string>): SqlNode

  /**
   * Creates a GLOB pattern matching comparison.
   * 
   * @param pattern - The glob pattern to match (use * for any characters, ? for single character)
   * @returns A SQL glob matching node
   * 
   * @example
   * ```ts
   * user.email.glob('*@gmail.com')  // user.email GLOB '*@gmail.com'
   * ```
   */
  glob(pattern: ColumnValue<string>): SqlNode

  /**
   * Checks if the column starts with the specified prefix.
   * 
   * @param prefix - The prefix to check for
   * @returns A SQL pattern matching node
   * 
   * @example
   * ```ts
   * user.name.startsWith('John')  // user.name LIKE 'John%'
   * ```
   */
  startsWith(prefix: ColumnValue<string>): SqlNode

  /**
   * Checks if the column ends with the specified suffix.
   * 
   * @param suffix - The suffix to check for
   * @returns A SQL pattern matching node
   * 
   * @example
   * ```ts
   * user.email.endsWith('@gmail.com')  // user.email LIKE '%@gmail.com'
   * ```
   */
  endsWith(suffix: ColumnValue<string>): SqlNode

  /**
   * Checks if the column contains the specified substring.
   * 
   * @param substring - The substring to search for
   * @returns A SQL pattern matching node
   * 
   * @example
   * ```ts
   * user.bio.contains('developer')  // user.bio LIKE '%developer%'
   * ```
   */
  contains(substring: ColumnValue<string>): SqlNode

  /**
   * Converts the column text to uppercase.
   * 
   * @returns The column with UPPER function applied
   * 
   * @example
   * ```ts
   * user.name.upper()  // UPPER(user.name)
   * ```
   */
  upper(): this

  /**
   * Converts the column text to lowercase.
   * 
   * @returns The column with LOWER function applied
   * 
   * @example
   * ```ts
   * user.email.lower()  // LOWER(user.email)
   * ```
   */
  lower(): this

  /**
   * Gets the character length of the column text.
   * 
   * @returns The column with LENGTH function applied
   * 
   * @example
   * ```ts
   * user.bio.length()  // LENGTH(user.bio)
   * ```
   */
  length(): this

  /**
   * Removes leading and trailing whitespace from the column text.
   * 
   * @returns The column with TRIM function applied
   * 
   * @example
   * ```ts
   * user.name.trim()  // TRIM(user.name)
   * ```
   */
  trim(): this

  /**
   * Removes leading whitespace from the column text.
   * 
   * @returns The column with LTRIM function applied
   * 
   * @example
   * ```ts
   * user.description.ltrim()  // LTRIM(user.description)
   * ```
   */
  ltrim(): this

  /**
   * Removes trailing whitespace from the column text.
   * 
   * @returns The column with RTRIM function applied
   * 
   * @example
   * ```ts
   * user.notes.rtrim()  // RTRIM(user.notes)
   * ```
   */
  rtrim(): this

  /**
   * Extracts a substring from the column text.
   * 
   * @param start - The starting position (1-based)
   * @param length - The number of characters to extract (optional)
   * @returns The column with SUBSTR function applied
   * 
   * @example
   * ```ts
   * user.name.substr(1, 5)  // SUBSTR(user.name, 1, 5)
   * ```
   */
  substr(start?: ColumnValue<number>, length?: ColumnValue<number>): this

  /**
   * Replaces occurrences of text within the column.
   * 
   * @param search - The text to search for
   * @param replacement - The replacement text
   * @returns The column with REPLACE function applied
   * 
   * @example
   * ```ts
   * user.phone.replace('-', '')  // REPLACE(user.phone, '-', '')
   * ```
   */
  replace(search: ColumnValue<number>, replacement: ColumnValue<number>): this

  /**
   * Finds the position of a substring within the column text.
   * 
   * @param substring - The substring to find
   * @returns A SQL function node that returns the position (0 if not found)
   * 
   * @example
   * ```ts
   * user.email.instr('@')  // INSTR(user.email, '@')
   * ```
   */
  instr(substring: ColumnValue<string>): SqlNode
}

/**
 * Interface for date/time columns with temporal operations.
 */
export interface IDateTimeColumn<TName extends string = string>
  extends IColumn<TName, Date | string> {
  /**
   * Creates a greater-than comparison for dates.
   * 
   * @param arg - The date to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.createdAt.gt(new Date('2024-01-01'))  // user.createdAt > '2024-01-01'
   * ```
   */
  gt(arg: ColumnValue<Date>): SqlNode

  /**
   * Creates a less-than comparison for dates.
   * 
   * @param arg - The date to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.expiresAt.lt(new Date())  // user.expiresAt < NOW
   * ```
   */
  lt(arg: ColumnValue<Date>): SqlNode

  /**
   * Creates a greater-than-or-equal comparison for dates.
   * 
   * @param arg - The date to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.lastLogin.ge(yesterday)  // user.lastLogin >= yesterday
   * ```
   */
  ge(arg: ColumnValue<Date>): SqlNode

  /**
   * Creates a less-than-or-equal comparison for dates.
   * 
   * @param arg - The date to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.birthDate.le(maxDate)  // user.birthDate <= maxDate
   * ```
   */
  le(arg: ColumnValue<Date>): SqlNode

  /**
   * Creates a BETWEEN range comparison for dates.
   * 
   * @param lower - The start date (inclusive)
   * @param upper - The end date (inclusive)
   * @returns A SQL range comparison node
   * 
   * @example
   * ```ts
   * user.createdAt.between(startDate, endDate)  // user.createdAt BETWEEN startDate AND endDate
   * ```
   */
  between(lower: ColumnValue<Date>, upper: ColumnValue<Date>): SqlNode

  /**
   * Extracts the date part from a datetime column.
   * 
   * @returns The column with DATE function applied
   * 
   * @example
   * ```ts
   * user.createdAt.date()  // DATE(user.createdAt)
   * ```
   */
  date(): this

  /**
   * Extracts the time part from a datetime column.
   * 
   * @returns The column with TIME function applied
   * 
   * @example
   * ```ts
   * user.loginAt.time()  // TIME(user.loginAt)
   * ```
   */
  time(): this

  /**
   * Converts the column to datetime format.
   * 
   * @returns The column with DATETIME function applied
   * 
   * @example
   * ```ts
   * user.timestamp.dateTime()  // DATETIME(user.timestamp)
   * ```
   */
  dateTime(): this

  /**
   * Formats the datetime column using a format string.
   * 
   * @param format - The strftime format string
   * @returns The column with STRFTIME function applied
   * 
   * @example
   * ```ts
   * user.createdAt.strftime('%Y-%m-%d')  // STRFTIME('%Y-%m-%d', user.createdAt)
   * ```
   */
  strftime(format: ColumnValue<string>): this

  /**
   * Converts the datetime column to Julian day number.
   * 
   * @returns The column with JULIANDAY function applied
   * 
   * @example
   * ```ts
   * user.birthDate.julianday()  // JULIANDAY(user.birthDate)
   * ```
   */
  julianday(): this

  /**
   * Extracts the year from the datetime column.
   * 
   * @returns The column with year extraction applied
   * 
   * @example
   * ```ts
   * user.createdAt.year()  // STRFTIME('%Y', user.createdAt)
   * ```
   */
  year(): this

  /**
   * Extracts the month from the datetime column.
   * 
   * @returns The column with month extraction applied
   * 
   * @example
   * ```ts
   * user.birthDate.month()  // STRFTIME('%m', user.birthDate)
   * ```
   */
  month(): this

  /**
   * Extracts the day from the datetime column.
   * 
   * @returns The column with day extraction applied
   * 
   * @example
   * ```ts
   * user.birthDate.day()  // STRFTIME('%d', user.birthDate)
   * ```
   */
  day(): this
}

/**
 * Interface for boolean columns.
 */
export interface IBooleanColumn<TName extends string = string>
  extends IColumn<TName, boolean> {
}

/**
 * Interface for JSON columns.
 */
export interface IJsonColumn<TName extends string = string>
  extends IColumn<TName, Record<string, any>> {
}

/**
 * Base column class with common SQL operations.
 * Provides core functionality available to all column types including
 * comparisons, null checks, aliasing, and basic aggregates.
 */
export class Column<
  TName extends string = string,
  TType extends SqlParam = SqlParam
> extends SqlNode implements IColumn<TName, TType> {
  protected _node?: SqlNode

  constructor(
    protected readonly _name: TName,
    protected readonly _table?: string,
    protected readonly _type?: TType
  )

  /**
   * Creates a new column instance wrapping the given node.
   * Preserves the column's metadata for method chaining.
   */
  protected wrap<T extends Column<TName, TType>>(node: SqlNode): T

  render(params: ParameterReg): string
  distinct(): this
  all(): this
  eq(arg: ColumnValue<TType>): SqlNode
  ne(arg: ColumnValue<TType>): SqlNode
  in(args: TType[]): SqlNode
  isNull(): SqlNode
  isNotNull(): SqlNode
  as(asName: ColumnValue<string>): SqlNode
  set(arg: ColumnValue<TType>): SqlNode
  asc(): SqlNode
  desc(): SqlNode
  count(): this
  max(): this
  min(): this
}

/**
 * Text column class with string manipulation and pattern matching operations.
 */
export class TextColumn<TName extends string = string>
  extends Column<TName, string>
  implements ITextColumn<TName> {
  like(pattern: ColumnValue<string>): SqlNode
  glob(pattern: ColumnValue<string>): SqlNode
  startsWith(prefix: ColumnValue<string>): SqlNode
  endsWith(suffix: ColumnValue<string>): SqlNode
  contains(substring: ColumnValue<string>): SqlNode
  upper(): this
  lower(): this
  length(): this
  trim(): this
  ltrim(): this
  rtrim(): this
  substr(start?: ColumnValue<number>, length?: ColumnValue<number>): this
  replace(search: ColumnValue<number>, replacement: ColumnValue<number>): this
  instr(substring: ColumnValue<string>): SqlNode
}

/**
 * Numeric column class with mathematical operations and comparisons.
 */
export class NumberColumn<TName extends string = string>
  extends Column<TName, number>
  implements INumberColumn<TName> {
  gt(arg: ColumnValue<number>): SqlNode
  lt(arg: ColumnValue<number>): SqlNode
  ge(arg: ColumnValue<number>): SqlNode
  le(arg: ColumnValue<number>): SqlNode
  between(lower: ColumnValue<number>, upper: ColumnValue<number>): SqlNode
  add(arg: ColumnValue<number>): this
  sub(arg: ColumnValue<number>): this
  mul(arg: ColumnValue<number>): this
  div(arg: ColumnValue<number>): this
  abs(): this
  round(decimals?: ColumnValue<number>): this
  ceil(): this
  floor(): this
  sqrt(): this
  mod(divisor: ColumnValue<number>): this
  pow(exponent: ColumnValue<number>): this
  percent(total: ColumnValue<number>): this
  avg(): this
  sum(): this
}

/**
 * DateTime column class with date/time manipulation and comparison operations.
 */
export class DateTimeColumn<TName extends string = string>
  extends Column<TName, Date | string>
  implements IDateTimeColumn<TName> {
  gt(arg: ColumnValue<Date>): SqlNode
  lt(arg: ColumnValue<Date>): SqlNode
  ge(arg: ColumnValue<Date>): SqlNode
  le(arg: ColumnValue<Date>): SqlNode
  between(lower: ColumnValue<Date>, upper: ColumnValue<Date>): SqlNode
  date(): this
  time(): this
  dateTime(): this
  strftime(format: ColumnValue<string>): this
  julianday(): this
  year(): this
  month(): this
  day(): this
}

/**
 * Boolean column class for true/false values.
 */
export class BooleanColumn<TName extends string = string>
  extends Column<TName, boolean>
  implements IBooleanColumn<TName> {
}

/**
 * JSON column class for structured data storage.
 */
export class JsonColumn<TName extends string = string>
  extends Column<TName, Record<string, any>>
  implements IJsonColumn<TName> {
}

/**
 * Factory functions for creating column type instances.
 * Use these to define your table schema.
 */
export const SqlType = {
  /**
   * Creates a numeric column type.
   * 
   * @returns A number type for schema definition
   * 
   * @example
   * ```ts
   * { age: SqlType.number() }  // Creates a NumberColumn
   * ```
   */
  number: (): number => 0,

  /**
   * Creates a text column type.
   * 
   * @returns A string type for schema definition
   * 
   * @example
   * ```ts
   * { name: SqlType.text() }  // Creates a TextColumn
   * ```
   */
  text: (): string => '',

  /**
   * Creates a boolean column type.
   * 
   * @returns A boolean type for schema definition
   * 
   * @example
   * ```ts
   * { active: SqlType.boolean() }  // Creates a BooleanColumn
   * ```
   */
  boolean: (): boolean => true,

  /**
   * Creates a date/time column type.
   * 
   * @returns A Date type for schema definition
   * 
   * @example
   * ```ts
   * { createdAt: SqlType.date() }  // Creates a DateTimeColumn
   * ```
   */
  date: (): Date => new Date(),

  /**
   * Creates a binary data column type.
   * 
   * @returns A Uint8Array type for schema definition
   * 
   * @example
   * ```ts
   * { data: SqlType.list() }  // Creates a binary column
   * ```
   */
  list: (): Uint8Array | null => null,

  /**
   * Creates a JSON column type.
   * 
   * @returns A Record type for schema definition
   * 
   * @example
   * ```ts
   * { metadata: SqlType.json() }  // Creates a JsonColumn
   * ```
   */
  json: (): Record<string, any> | undefined => undefined
} as const
```

## src/api/query-builders.ts

```typescript
/**
 * Base class for all SQL query builders.
 * Provides common functionality for building and executing SQL queries.
 */
export abstract class SqlQueryBuilder extends SqlNode {
  protected _parts: SqlNode[] = []
  protected _params?: ParameterReg
  protected _cache?: { sql: string; params: readonly SqlDataType[] }

  constructor()

  /**
   * Renders the query to a SQL string with parameters.
   * 
   * @returns The complete SQL string
   */
  render(): SqlString

  /**
   * Adds a SQL clause or node to the query.
   * 
   * @param part - The SQL node to add
   * @returns The query builder for method chaining
   */
  protected add(part: SqlNode): this

  /**
   * Gets the generated SQL string.
   * 
   * @returns The SQL string ready for execution
   * 
   * @example
   * ```ts
   * query.sql  // "SELECT * FROM users WHERE active = :p1"
   * ```
   */
  get sql(): SqlString

  /**
   * Gets the parameter values for the query.
   * 
   * @returns Array of parameter values in order
   * 
   * @example
   * ```ts
   * query.params  // [true]
   * ```
   */
  get params(): readonly SqlDataType[]

  /**
   * Adds a Common Table Expression (CTE) to the query.
   * 
   * @param name - The name for the CTE
   * @param query - The SELECT query that defines the CTE
   * @param recursive - Whether to use WITH RECURSIVE
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.with('active_users', users.select().where(users.active.eq(true)))
   * // WITH active_users AS (SELECT * FROM users WHERE active = true)
   * ```
   */
  with(name: string, query: Select, recursive?: boolean): this

  /**
   * Adds WHERE conditions to filter the results.
   * 
   * @param conditions - The conditions that must be true
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.where(user.active.eq(true), user.age.gt(18))
   * // WHERE user.active = true AND user.age > 18
   * ```
   */
  where(...conditions: SqlNodeValue[]): this

  /**
   * Adds ORDER BY clauses to sort the results.
   * 
   * @param columns - The columns to sort by
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.orderBy(user.name.asc(), user.createdAt.desc())
   * // ORDER BY user.name ASC, user.createdAt DESC
   * ```
   */
  orderBy(...columns: SqlNodeValue[]): this

  /**
   * Limits the number of results returned.
   * 
   * @param count - The maximum number of rows to return
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.limit(10)  // LIMIT 10
   * ```
   */
  limit(count: SqlNodeValue): this

  /**
   * Skips a number of rows for pagination.
   * 
   * @param count - The number of rows to skip
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.offset(20)  // OFFSET 20
   * ```
   */
  offset(count: SqlNodeValue): this
}

/**
 * Query builder for SELECT statements.
 * Use this to retrieve data from tables with filtering, joining, and sorting.
 */
export class Select extends SqlQueryBuilder {
  constructor(
    private readonly table: string,
    private readonly columns?: SqlNodeValue[]
  )

  /**
   * Joins another table to the query.
   * 
   * @param table - The table to join
   * @returns An object with join type methods
   * 
   * @example
   * ```ts
   * query.join(profiles).inner(user.id.eq(profile.userId))
   * // INNER JOIN profiles ON user.id = profile.userId
   * ```
   */
  join(table: SqlNodeValue): {
    inner: (condition?: SqlNodeValue) => this
    left: (condition?: SqlNodeValue) => this
    leftOuter: (condition?: SqlNodeValue) => this
    cross: () => this
  }

  /**
   * Groups results by the specified columns for aggregation.
   * 
   * @param columns - The columns to group by
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.groupBy(user.department, user.role)
   * // GROUP BY user.department, user.role
   * ```
   */
  groupBy(...columns: SqlNodeValue[]): this

  /**
   * Filters grouped results with conditions.
   * 
   * @param conditions - The conditions to filter grouped results
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.having(count(user.id).gt(5))
   * // HAVING COUNT(user.id) > 5
   * ```
   */
  having(...conditions: SqlNodeValue[]): this

  /**
   * Renders the query, adding parentheses when used as a subquery.
   * 
   * @param params - Optional parameter registry for subquery context
   * @returns The SQL string, with parentheses if used as subquery
   */
  override render(params?: ParameterReg): SqlString
}

/**
 * Query builder for INSERT statements.
 * Use this to add new rows to tables with conflict resolution.
 */
export class Insert extends SqlQueryBuilder {
  constructor(
    private readonly table: string,
    private readonly columns: SqlNodeValue[]
  )

  /**
   * Adds a row of values to insert.
   * 
   * @param args - The values for each column in order
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.values('John', 25, 'admin')
   * // VALUES ('John', 25, 'admin')
   * ```
   */
  values(...args: SqlNodeValue[]): this

  /**
   * Specifies how to handle conflicts during insert.
   * 
   * @param targets - The columns that might cause conflicts
   * @returns An object with conflict resolution methods
   * 
   * @example
   * ```ts
   * query.conflict('email').nothing()
   * // ON CONFLICT (email) DO NOTHING
   * 
   * query.conflict('email').upsert([user.name.set('Updated Name')])
   * // ON CONFLICT (email) DO UPDATE SET user.name = 'Updated Name'
   * ```
   */
  conflict(...targets: SqlNodeValue[]): {
    abort: () => this
    fail: () => this
    ignore: () => this
    replace: () => this
    rollback: () => this
    nothing: () => this
    upsert: (assignments: SqlNodeValue[], ...conditions: SqlNodeValue[]) => this
  }

  /**
   * Returns data from the inserted rows.
   * 
   * @param columns - The columns to return (defaults to * if empty)
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.returning(user.id, user.createdAt)
   * // RETURNING user.id, user.createdAt
   * ```
   */
  returning(...columns: SqlNodeValue[]): this
}

/**
 * Query builder for UPDATE statements.
 * Use this to modify existing rows in tables.
 */
export class Update extends SqlQueryBuilder {
  constructor(
    private readonly table: string,
    assignments: SqlNodeValue[]
  )

  /**
   * Specifies how to handle conflicts during update.
   * 
   * @param targets - The columns that might cause conflicts
   * @returns An object with conflict resolution methods
   * 
   * @example
   * ```ts
   * query.conflict('unique_key').nothing()
   * // ON CONFLICT (unique_key) DO NOTHING
   * ```
   */
  conflict(...targets: SqlNodeValue[]): {
    abort: () => this
    fail: () => this
    ignore: () => this
    replace: () => this
    rollback: () => this
    nothing: () => this
    upsert: (assignments: SqlNodeValue[], ...conditions: SqlNodeValue[]) => this
  }

  /**
   * Returns data from the updated rows.
   * 
   * @param columns - The columns to return (defaults to * if empty)
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.returning(user.id, user.updatedAt)
   * // RETURNING user.id, user.updatedAt
   * ```
   */
  returning(...columns: SqlNodeValue[]): this
}

/**
 * Query builder for DELETE statements.
 * Use this to remove rows from tables.
 */
export class Delete extends SqlQueryBuilder {
  constructor(private readonly table: string)

  /**
   * Returns data from the deleted rows.
   * 
   * @param columns - The columns to return (defaults to * if empty)
   * @returns The query builder for method chaining
   * 
   * @example
   * ```ts
   * query.returning(user.id, user.name)
   * // RETURNING user.id, user.name
   * ```
   */
  returning(...columns: SqlNodeValue[]): this
}
```

## src/api/sparq.ts

```typescript
/**
 * Main class for creating schema-aware query builders.
 * Provides type-safe access to table columns and query operations.
 */
export class Sparq<T extends TableSchema> {
  public readonly table: string
  private readonly columns: ColumnsProxy<T>

  constructor(table: string, schema: T)

  /**
   * Provides direct access to typed columns via the $ property.
   * 
   * @returns Typed column accessors for the table
   * 
   * @example
   * ```ts
   * const users = sparq('users', { name: SqlType.text(), age: SqlType.number() })
   * users.$.name.eq('John')  // Type-safe column access
   * users.$.age.gt(18)       // Type-safe numeric operations
   * ```
   */
  get $(): ColumnsProxy<T>

  /**
   * Creates a SELECT query for this table.
   * 
   * @param columns - The columns to select (defaults to * if empty)
   * @returns A SELECT query builder
   * 
   * @example
   * ```ts
   * users.select(users.$.name, users.$.email)
   * // SELECT users.name, users.email FROM users
   * 
   * users.select()  // SELECT * FROM users
   * ```
   */
  select(...columns: SqlNodeValue[]): Select

  /**
   * Creates an INSERT query for this table.
   * 
   * @param columns - The columns to insert values into
   * @returns An INSERT query builder
   * 
   * @example
   * ```ts
   * users.insert('name', 'email', 'age')
   *   .values('John', 'john@example.com', 25)
   * // INSERT INTO users (name, email, age) VALUES ('John', 'john@example.com', 25)
   * ```
   */
  insert(...columns: (keyof T | Column<string, SqlParam> | SqlNodeValue)[]): Insert

  /**
   * Creates an UPDATE query for this table.
   * 
   * @param assignments - Column assignments (object or array of assignment nodes)
   * @returns An UPDATE query builder
   * 
   * @example
   * ```ts
   * // Using object syntax
   * users.update({ name: 'Jane', age: 26 })
   *   .where(users.$.id.eq(1))
   * 
   * // Using assignment nodes
   * users.update([users.$.name.set('Jane'), users.$.age.set(26)])
   *   .where(users.$.id.eq(1))
   * // UPDATE users SET name = 'Jane', age = 26 WHERE id = 1
   * ```
   */
  update(assignments: Partial<T> | SqlNodeValue[]): Update

  /**
   * Creates a DELETE query for this table.
   * 
   * @returns A DELETE query builder
   * 
   * @example
   * ```ts
   * users.delete().where(users.$.active.eq(false))
   * // DELETE FROM users WHERE active = false
   * ```
   */
  delete(): Delete
}

/**
 * Creates a reusable, schema-aware query builder for a table.
 * 
 * @param tableName - The name of the database table
 * @param schema - The table schema definition using SqlType factory functions
 * @returns A Sparq instance with type-safe column access and query methods
 * 
 * @example
 * ```ts
 * // Define a table schema
 * const users = sparq('users', {
 *   id: SqlType.number(),
 *   name: SqlType.text(),
 *   email: SqlType.text(),
 *   age: SqlType.number(),
 *   active: SqlType.boolean(),
 *   createdAt: SqlType.date()
 * })
 * 
 * // Use type-safe queries
 * const query = users
 *   .select(users.$.name, users.$.email)
 *   .where(users.$.active.eq(true), users.$.age.gt(18))
 *   .orderBy(users.$.name.asc())
 *   .limit(10)
 * 
 * console.log(query.sql)     // Generated SQL string
 * console.log(query.params)  // Parameter values
 * ```
 */
export function sparq<T extends TableSchema>(
  tableName: string,
  schema: T
): Sparq<T>
```

## Additional Type Definitions

```typescript
/**
 * Represents a table schema as a mapping of column names to their types.
 * Use SqlType factory functions to define column types.
 * 
 * @example
 * ```ts
 * type UserSchema = {
 *   id: number
 *   name: string
 *   email: string
 *   active: boolean
 *   createdAt: Date
 * }
 * ```
 */
type TableSchema = Record<string, SqlParam>

/**
 * Maps schema column types to their corresponding column interface types.
 * This provides IntelliSense and type checking for column operations.
 */
type ColumnTypeMapping<K extends string, T extends SqlParam> = 
  T extends number ? INumberColumn<K>
  : T extends string ? ITextColumn<K>
  : T extends Date ? IDateTimeColumn<K>
  : T extends boolean ? IBooleanColumn<K>
  : T extends Record<string, any> ? IJsonColumn<K>
  : T extends Uint8Array ? IColumn<K, T>
  : T extends null ? IColumn<K, T>
  : IColumn<K, T>

/**
 * Creates a proxy object that provides typed access to table columns.
 * Each column has methods appropriate for its data type.
 */
type ColumnsProxy<T extends TableSchema> = {
  [K in keyof T]: ColumnTypeMapping<K & string, T[K]>
}

/**
 * Union type for values that can be used in column operations.
 */
type ColumnValue<TType extends SqlParam = SqlParam> = any
```

## Example Usage Patterns

```typescript
/**
 * Basic table definition and querying:
 * 
 * @example
 * ```ts
 * // 1. Define your table schema
 * const users = sparq('users', {
 *   id: SqlType.number(),
 *   name: SqlType.text(),
 *   email: SqlType.text(),
 *   age: SqlType.number(),
 *   active: SqlType.boolean(),
 *   createdAt: SqlType.date()
 * })
 * 
 * // 2. Destructure column accessors for convenience
 * const { $ } = users
 * 
 * // 3. Build type-safe queries
 * const activeAdults = users
 *   .select($.name, $.email, $.age)
 *   .where($.active.eq(true), $.age.ge(18))
 *   .orderBy($.name.asc())
 * 
 * // 4. Execute with any SQLite driver
 * const result = await db.prepare(activeAdults.sql).all(activeAdults.params)
 * ```
 */

/**
 * Advanced querying with joins and aggregations:
 * 
 * @example
 * ```ts
 * // Define related tables
 * const orders = sparq('orders', {
 *   id: SqlType.number(),
 *   userId: SqlType.number(),
 *   total: SqlType.number(),
 *   status: SqlType.text(),
 *   createdAt: SqlType.date()
 * })
 * 
 * const { $: u } = users
 * const { $: o } = orders
 * 
 * // Complex query with joins and aggregations
 * const userOrderStats = users
 *   .select(
 *     u.name,
 *     u.email,
 *     o.total.count().as('order_count'),
 *     o.total.sum().as('total_spent'),
 *     o.total.avg().as('avg_order')
 *   )
 *   .join(orders).inner(u.id.eq(o.userId))
 *   .where(o.status.eq('completed'))
 *   .groupBy(u.id, u.name, u.email)
 *   .having(o.total.count().gt(5))
 *   .orderBy(desc(o.total.sum()))
 *   .limit(10)
 * ```
 */

/**
 * Data modification operations:
 * 
 * @example
 * ```ts
 * // Insert new users
 * const insertQuery = users
 *   .insert('name', 'email', 'age', 'active')
 *   .values('John Doe', 'john@example.com', 25, true)
 *   .values('Jane Smith', 'jane@example.com', 30, true)
 *   .returning($.id, $.createdAt)
 * 
 * // Update existing users
 * const updateQuery = users
 *   .update([$.name.set('John Updated'), $.age.set(26)])
 *   .where($.email.eq('john@example.com'))
 *   .returning($.id, $.name)
 * 
 * // Upsert with conflict resolution
 * const upsertQuery = users
 *   .insert('email', 'name', 'age')
 *   .values('new@example.com', 'New User', 22)
 *   .conflict('email').upsert([
 *     $.name.set('Updated User'),
 *     $.age.set(23)
 *   ])
 * 
 * // Delete inactive users
 * const deleteQuery = users
 *   .delete()
 *   .where($.active.eq(false), $.createdAt.lt(oneYearAgo))
 *   .returning($.id, $.name)
 * ```
 */

/**
 * Working with different column types:
 * 
 * @example
 * ```ts
 * const products = sparq('products', {
 *   id: SqlType.number(),
 *   name: SqlType.text(),
 *   price: SqlType.number(),
 *   description: SqlType.text(),
 *   inStock: SqlType.boolean(),
 *   createdAt: SqlType.date(),
 *   metadata: SqlType.json()
 * })
 * 
 * const { $ } = products
 * 
 * // Text operations
 * const searchQuery = products
 *   .select()
 *   .where(
 *     $.name.contains('laptop'),           // name LIKE '%laptop%'
 *     $.description.startsWith('High'),    // description LIKE 'High%'
 *     $.name.length().gt(5)               // LENGTH(name) > 5
 *   )
 * 
 * // Numeric operations
 * const priceQuery = products
 *   .select(
 *     $.name,
 *     $.price,
 *     $.price.mul(1.1).as('price_with_tax'),  // price * 1.1
 *     $.price.round(2).as('rounded_price')    // ROUND(price, 2)
 *   )
 *   .where($.price.between(100, 1000))        // price BETWEEN 100 AND 1000
 * 
 * // Date operations
 * const recentQuery = products
 *   .select(
 *     $.name,
 *     $.createdAt.date().as('created_date'),        // DATE(createdAt)
 *     $.createdAt.strftime('%Y-%m').as('month')     // STRFTIME('%Y-%m', createdAt)
 *   )
 *   .where($.createdAt.gt(new Date('2024-01-01')))
 * 
 * // Boolean operations
 * const stockQuery = products
 *   .select()
 *   .where($.inStock.eq(true))               // inStock = 1 (true)
 * ```
 */

/**
 * Using Common Table Expressions (CTEs):
 * 
 * @example
 * ```ts
 * // Create a CTE for high-value customers
 * const highValueCustomers = users
 *   .select($.id, $.name, $.email)
 *   .join(orders).inner($.id.eq(o.userId))
 *   .groupBy($.id, $.name, $.email)
 *   .having(o.total.sum().gt(10000))
 * 
 * // Use the CTE in a main query
 * const finalQuery = users
 *   .select($.name, $.email)
 *   .with('high_value_customers', highValueCustomers)
 *   .where($.id.in([1, 2, 3]))
 * 
 * // Generates:
 * // WITH high_value_customers AS (
 * //   SELECT users.id, users.name, users.email
 * //   FROM users INNER JOIN orders ON users.id = orders.userId
 * //   GROUP BY users.id, users.name, users.email
 * //   HAVING SUM(orders.total) > 10000
 * // )
 * // SELECT users.name, users.email
 * // FROM users
 * // WHERE users.id IN (1, 2, 3)
 * ```
 */

/**
 * Error handling and debugging:
 * 
 * @example
 * ```ts
 * try {
 *   const query = users
 *     .select($.name, $.email)
 *     .where($.active.eq(true))
 * 
 *   // Debug the generated SQL
 *   console.log('SQL:', query.sql)
 *   console.log('Params:', query.params)
 * 
 *   // Execute with your preferred SQLite driver
 *   const result = await db.prepare(query.sql).all(query.params)
 *   
 * } catch (error) {
 *   console.error('Query error:', error)
 *   // Handle query building or execution errors
 * }
 * ```
 */
``` Registers a parameter value and returns its placeholder.
   * Automatically deduplicates identical values.
   * 
   * @param value - The value to parameterize
   * @param name - Optional custom parameter name
   * @returns The parameter placeholder (e.g., ':p1')
   * 
   * @example
   * ```ts
   * params.add('hello')           // ':p1'
   * params.add('hello')           // ':p1' (same reference)
   * params.add('world', 'custom') // ':custom'
   * ```
   */
  add(value: SqlDataType, name?: string): string

  /**
   * Gets all parameter values as an array.
   * 
   * @returns Array of parameter values in order
   * 
   * @example
   * ```ts
   * params.toArray()  // ['John', 'Jane', 42]
   * ```
   */
  toArray(): readonly SqlDataType[]

  /**
   * Gets all parameters as a name-value object.
   * 
   * @returns Object mapping parameter names to values
   * 
   * @example
   * ```ts
   * params.toObject()  // { p1: 'John', p2: 'Jane', p3: 42 }
   * ```
   */
  toObject(): Readonly<Record<string, SqlDataType>>

  /**
   * Gets the current parameter index.
   * 
   * @returns The number of unique parameters registered
   */
  get index(): number
}
```

## src/core/sql-node.ts

```typescript
/**
 * Checks if a value is a valid SQL parameter.
 * 
 * @param value - The value to check
 * @returns True if the value can be used as a SQL parameter
 * 
 * @example
 * ```ts
 * isSqlParam('hello')        // true
 * isSqlParam(42)             // true
 * isSqlParam(new Date())     // true
 * isSqlParam(function(){})   // false
 * ```
 */
export function isSqlParam(value: unknown): value is SqlParam

/**
 * Base class for all SQL AST nodes.
 * Provides the foundation for building SQL expressions.
 */
export abstract class SqlNode {
  /**
   * Gets the priority for ordering SQL clauses.
   * 
   * @returns The priority number (lower = earlier in query)
   */
  get priority(): number

  /**
   * Renders the node to a SQL string.
   * 
   * @param params - The parameter registry for parameterization
   * @returns The rendered SQL string
   */
  abstract render(params: ParameterReg): SqlString
}

/**
 * Checks if a value is a SQL node.
 * 
 * @param value - The value to check
 * @returns True if the value is a SQL node
 * 
 * @example
 * ```ts
 * isSqlNode(new LiteralNode('hello'))  // true
 * isSqlNode('hello')                   // false
 * ```
 */
export function isSqlNode(value: any): value is SqlNode

/**
 * Sorts SQL nodes based on their priority for proper clause ordering.
 * 
 * @param nodes - The nodes to sort
 * @returns The sorted nodes in execution order
 * 
 * @example
 * ```ts
 * // Ensures SELECT comes before FROM, WHERE, etc.
 * sortSqlNodes([whereNode, selectNode, fromNode])
 * ```
 */
export function sortSqlNodes(nodes: SqlNode[]): readonly SqlNode[]

/**
 * Renders multiple SQL nodes to strings.
 * 
 * @param nodes - The nodes to render
 * @param params - The parameter registry
 * @param sort - Whether to sort nodes by priority first
 * @returns Array of rendered SQL strings
 * 
 * @example
 * ```ts
 * renderSqlNodes([selectNode, fromNode], params, true)
 * // ['SELECT *', 'FROM users']
 * ```
 */
export function renderSqlNodes(
  nodes: ArrayLike<SqlNode>,
  params: ParameterReg,
  sort?: boolean
): string[]
```

## src/nodes/primitives.ts

```typescript
/**
 * Creates a raw SQL string node that won't be parameterized.
 * Use this for SQL keywords and syntax.
 * 
 * @param sql - The raw SQL string
 * @returns A raw SQL node
 * 
 * @example
 * ```ts
 * raw('SELECT')    // SELECT (not parameterized)
 * raw('COUNT(*)')  // COUNT(*) (not parameterized)
 * ```
 */
export const raw = (sql: string): SqlNode

/**
 * Creates a literal value node that will be automatically parameterized.
 * Use this for user data and values.
 * 
 * @param value - The literal value or existing SQL node
 * @returns A literal node or the original node if already a SQL node
 * 
 * @example
 * ```ts
 * expr('hello')  // Creates :p1 parameter
 * expr(42)       // Creates :p2 parameter
 * expr(someNode) // Returns someNode unchanged
 * ```
 */
export const expr = (value: SqlNodeValue): SqlNode

/**
 * Creates an identifier node with automatic quoting when needed.
 * Use this for table and column names.
 * 
 * @param value - The identifier name or existing SQL node
 * @returns An identifier node with proper quoting
 * 
 * @example
 * ```ts
 * id('user')      // user (no quotes needed)
 * id('user-id')   // "user-id" (quotes added)
 * id('SELECT')    // "SELECT" (reserved keyword quoted)
 * ```
 */
export const id = (value: SqlNodeValue): SqlNode
```

## src/nodes/expressions.ts

```typescript
/**
 * Represents a unary operation with configurable operator positioning.
 */
export class UnaryNode extends SqlNode {
  constructor(
    private readonly operator: SqlNode,
    private readonly expr?: SqlNode,
    private readonly position: 'pfx' | 'sfx' = 'sfx'
  )

  render(params: ParameterReg): SqlString
}

/**
 * Represents a binary operation between two expressions.
 */
export class BinaryNode extends SqlNode {
  constructor(
    private readonly left: SqlNode,
    private readonly operator: SqlNode,
    private readonly right: SqlNode
  )

  render(params: ParameterReg): SqlString
}

/**
 * Represents a logical conjunction (AND/OR) with optional grouping.
 */
export class ConjunctionNode extends SqlNode {
  constructor(
    private readonly operator: SqlNode,
    private readonly conditions: ArrayLike<SqlNode>,
    private readonly grouped: boolean = false
  )

  render(params: ParameterReg): SqlString
}

/**
 * Combines multiple conditions with AND logic and wraps them in parentheses.
 * 
 * @param conditions - The conditions that must all be true
 * @returns A SQL node that combines the conditions with AND
 * 
 * @example
 * ```ts
 * and(user.active.eq(true), user.score.gt(100))
 * // (user.active = true AND user.score > 100)
 * ```
 */
export const and = conjunction(sql('AND'), true)

/**
 * Combines multiple conditions with OR logic and wraps them in parentheses.
 * 
 * @param conditions - The conditions where at least one must be true
 * @returns A SQL node that combines the conditions with OR
 * 
 * @example
 * ```ts
 * or(user.role.eq('admin'), user.role.eq('moderator'))
 * // (user.role = 'admin' OR user.role = 'moderator')
 * ```
 */
export const or = conjunction(sql('OR'), true)

/**
 * Creates a logical NOT expression to negate a condition.
 * 
 * @param value - The expression to negate
 * @returns A SQL node that negates the expression
 * 
 * @example
 * ```ts
 * not(user.active.eq(true))
 * // NOT user.active = true
 * ```
 */
export const not = unary(sql('NOT'), 'pfx')

/**
 * Creates an equality comparison between two expressions.
 * 
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that compares the expressions for equality
 * 
 * @example
 * ```ts
 * eq(user.name, 'John')
 * // user.name = 'John'
 * ```
 */
export const eq = binary('=')

/**
 * Creates a not-equal comparison between two expressions.
 * 
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that compares the expressions for inequality
 * 
 * @example
 * ```ts
 * ne(user.status, 'deleted')
 * // user.status != 'deleted'
 * ```
 */
export const ne = binary('!=')

/**
 * Creates a greater-than comparison between two expressions.
 * 
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is greater than right
 * 
 * @example
 * ```ts
 * gt(user.age, 18)
 * // user.age > 18
 * ```
 */
export const gt = binary('>')

/**
 * Creates a less-than comparison between two expressions.
 * 
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is less than right
 * 
 * @example
 * ```ts
 * lt(user.age, 65)
 * // user.age < 65
 * ```
 */
export const lt = binary('<')

/**
 * Creates a greater-than-or-equal comparison between two expressions.
 * 
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is greater than or equal to right
 * 
 * @example
 * ```ts
 * ge(user.score, 100)
 * // user.score >= 100
 * ```
 */
export const ge = binary('>=')

/**
 * Creates a less-than-or-equal comparison between two expressions.
 * 
 * @param left - The left-hand expression
 * @param right - The right-hand expression
 * @returns A SQL node that checks if left is less than or equal to right
 * 
 * @example
 * ```ts
 * le(user.score, 1000)
 * // user.score <= 1000
 * ```
 */
export const le = binary('<=')

/**
 * Creates a LIKE pattern matching comparison for text searching.
 * 
 * @param left - The expression to search in
 * @param right - The pattern to search for
 * @returns A SQL node that performs pattern matching
 * 
 * @example
 * ```ts
 * like(user.name, '%John%')
 * // user.name LIKE '%John%'
 * ```
 */
export const like = binary(sql('LIKE'))

/**
 * Creates a GLOB pattern matching comparison for Unix-style patterns.
 * 
 * @param left - The expression to search in
 * @param right - The glob pattern to match
 * @returns A SQL node that performs glob matching
 * 
 * @example
 * ```ts
 * glob(user.email, '*@gmail.com')
 * // user.email GLOB '*@gmail.com'
 * ```
 */
export const glob = binary(sql('GLOB'))

/**
 * Creates an IN comparison to check if a value exists in a list.
 * 
 * @param left - The expression to test
 * @param right - The list of values to check against
 * @returns A SQL node that checks membership in a list
 * 
 * @example
 * ```ts
 * in_(user.role, ['admin', 'moderator'])
 * // user.role IN ('admin', 'moderator')
 * ```
 */
export const in_ = binary(sql('IN'))

/**
 * Creates an addition operation between two numeric expressions.
 * 
 * @param left - The left operand
 * @param right - The right operand
 * @returns A SQL node that adds the operands
 * 
 * @example
 * ```ts
 * add(user.score, 10)
 * // user.score + 10
 * ```
 */
export const add = binary('+')

/**
 * Creates a subtraction operation between two numeric expressions.
 * 
 * @param left - The left operand
 * @param right - The right operand
 * @returns A SQL node that subtracts the right operand from the left
 * 
 * @example
 * ```ts
 * sub(user.balance, 100)
 * // user.balance - 100
 * ```
 */
export const sub = binary('-')

/**
 * Creates a multiplication operation between two numeric expressions.
 * 
 * @param left - The left operand
 * @param right - The right operand
 * @returns A SQL node that multiplies the operands
 * 
 * @example
 * ```ts
 * mul(user.hours, 15.50)
 * // user.hours * 15.50
 * ```
 */
export const mul = binary('*')

/**
 * Creates a division operation between two numeric expressions.
 * 
 * @param left - The dividend
 * @param right - The divisor
 * @returns A SQL node that divides the left operand by the right
 * 
 * @example
 * ```ts
 * div(user.total, user.count)
 * // user.total / user.count
 * ```
 */
export const div = binary('/')

/**
 * Creates a DISTINCT modifier to remove duplicate values.
 * 
 * @param value - The expression to apply DISTINCT to
 * @returns A SQL node with DISTINCT modifier
 * 
 * @example
 * ```ts
 * distinct(user.city)
 * // DISTINCT user.city
 * ```
 */
export const distinct = unary(sql('DISTINCT'), 'pfx')

/**
 * Creates an ALL quantifier (opposite of DISTINCT).
 * 
 * @param value - The expression to apply ALL to
 * @returns A SQL node with ALL quantifier
 * 
 * @example
 * ```ts
 * all(user.name)
 * // ALL user.name
 * ```
 */
export const all = unary(sql('ALL'), 'pfx')

/**
 * Creates an ascending sort order for ORDER BY clauses.
 * 
 * @param value - The expression to sort by
 * @returns A SQL node that sorts in ascending order
 * 
 * @example
 * ```ts
 * asc(user.name)
 * // user.name ASC
 * ```
 */
export const asc = unary(sql('ASC'))

/**
 * Creates a descending sort order for ORDER BY clauses.
 * 
 * @param value - The expression to sort by
 * @returns A SQL node that sorts in descending order
 * 
 * @example
 * ```ts
 * desc(user.createdAt)
 * // user.createdAt DESC
 * ```
 */
export const desc = unary(sql('DESC'))

/**
 * Creates a column or expression alias using AS.
 * 
 * @param value - The expression to alias
 * @param as - The alias name
 * @returns A SQL node with an alias
 * 
 * @example
 * ```ts
 * alias(user.firstName, 'name')
 * // user.firstName AS name
 * ```
 */
export const alias = (value: SqlNodeValue, as: SqlNodeValue): SqlNode

/**
 * Creates a BETWEEN range comparison to check if a value falls within bounds.
 * 
 * @param test - The expression to test
 * @param lower - The lower bound (inclusive)
 * @param upper - The upper bound (inclusive)
 * @returns A SQL node that checks if the test value is within the range
 * 
 * @example
 * ```ts
 * between(user.age, 18, 65)
 * // user.age BETWEEN 18 AND 65
 * ```
 */
export const between = (
  test: SqlNodeValue,
  lower: SqlNodeValue,
  upper: SqlNodeValue
): SqlNode

/**
 * Creates an EXISTS subquery check to test if a subquery returns any rows.
 * 
 * @param value - The subquery to test
 * @returns A SQL node that checks if the subquery has results
 * 
 * @example
 * ```ts
 * exists(orders.select().where(orders.userId.eq(user.id)))
 * // EXISTS (SELECT * FROM orders WHERE orders.userId = user.id)
 * ```
 */
export const exists = unary(sql('EXISTS'), 'pfx')

/**
 * Creates an IS NULL check to test if a value is null.
 * 
 * @param value - The expression to test
 * @returns A SQL node that checks for null values
 * 
 * @example
 * ```ts
 * isNull(user.deletedAt)
 * // user.deletedAt IS NULL
 * ```
 */
export const isNull = unary(sql('IS NULL'), 'sfx')

/**
 * Creates an IS NOT NULL check to test if a value is not null.
 * 
 * @param value - The expression to test
 * @returns A SQL node that checks for non-null values
 * 
 * @example
 * ```ts
 * isNotNull(user.email)
 * // user.email IS NOT NULL
 * ```
 */
export const isNotNull = unary(sql('IS NOT NULL'), 'sfx')
```

## src/nodes/functions.ts

```typescript
/**
 * Represents a SQL function call with arguments.
 */
export class FnNode extends SqlNode {
  constructor(
    private readonly name: SqlNode,
    private readonly expr: ArrayLike<SqlNode>
  )

  render(params: ParameterReg): SqlString
}

/**
 * Calculates the average value of a numeric column.
 * 
 * @param column - The column to average (optional, defaults to *)
 * @returns A SQL function node that calculates the average
 * 
 * @example
 * ```ts
 * avg(user.age)  // AVG(user.age)
 * avg()          // AVG(*)
 * ```
 */
export const avg = aggregate(sql('AVG'))

/**
 * Counts the number of rows or non-null values.
 * 
 * @param column - The column to count (optional, defaults to *)
 * @returns A SQL function node that counts rows
 * 
 * @example
 * ```ts
 * count(user.id)  // COUNT(user.id)
 * count()         // COUNT(*)
 * ```
 */
export const count = aggregate(sql('COUNT'))

/**
 * Finds the maximum value in a column.
 * 
 * @param column - The column to find the maximum of (optional, defaults to *)
 * @returns A SQL function node that finds the maximum
 * 
 * @example
 * ```ts
 * max(user.score)  // MAX(user.score)
 * ```
 */
export const max = aggregate(sql('MAX'))

/**
 * Finds the minimum value in a column.
 * 
 * @param column - The column to find the minimum of (optional, defaults to *)
 * @returns A SQL function node that finds the minimum
 * 
 * @example
 * ```ts
 * min(user.score)  // MIN(user.score)
 * ```
 */
export const min = aggregate(sql('MIN'))

/**
 * Calculates the sum of values in a numeric column.
 * 
 * @param column - The column to sum (optional, defaults to *)
 * @returns A SQL function node that calculates the sum
 * 
 * @example
 * ```ts
 * sum(order.total)  // SUM(order.total)
 * ```
 */
export const sum = aggregate(sql('SUM'))

/**
 * Converts text to uppercase.
 * 
 * @param args - The text expressions to convert
 * @returns A SQL function node that converts to uppercase
 * 
 * @example
 * ```ts
 * upper(user.name)  // UPPER(user.name)
 * ```
 */
export const upper = fn(sql('UPPER'))

/**
 * Converts text to lowercase.
 * 
 * @param args - The text expressions to convert
 * @returns A SQL function node that converts to lowercase
 * 
 * @example
 * ```ts
 * lower(user.email)  // LOWER(user.email)
 * ```
 */
export const lower = fn(sql('LOWER'))

/**
 * Gets the character length of a text value.
 * 
 * @param args - The text expressions to measure
 * @returns A SQL function node that returns the length
 * 
 * @example
 * ```ts
 * length(user.bio)  // LENGTH(user.bio)
 * ```
 */
export const length = fn(sql('LENGTH'))

/**
 * Removes leading and trailing whitespace from text.
 * 
 * @param args - The text expressions to trim
 * @returns A SQL function node that trims whitespace
 * 
 * @example
 * ```ts
 * trim(user.name)  // TRIM(user.name)
 * ```
 */
export const trim = fn(sql('TRIM'))

/**
 * Removes leading whitespace from text.
 * 
 * @param args - The text expressions to trim
 * @returns A SQL function node that trims leading whitespace
 * 
 * @example
 * ```ts
 * ltrim(user.description)  // LTRIM(user.description)
 * ```
 */
export const ltrim = fn(sql('LTRIM'))

/**
 * Removes trailing whitespace from text.
 * 
 * @param args - The text expressions to trim
 * @returns A SQL function node that trims trailing whitespace
 * 
 * @example
 * ```ts
 * rtrim(user.notes)  // RTRIM(user.notes)
 * ```
 */
export const rtrim = fn(sql('RTRIM'))

/**
 * Extracts a substring from text.
 * 
 * @param args - The text, start position, and optional length
 * @returns A SQL function node that extracts a substring
 * 
 * @example
 * ```ts
 * substr(user.name, 1, 5)  // SUBSTR(user.name, 1, 5)
 * ```
 */
export const substr = fn(sql('SUBSTR'))

/**
 * Replaces occurrences of text within a string.
 * 
 * @param args - The text, search pattern, and replacement
 * @returns A SQL function node that replaces text
 * 
 * @example
 * ```ts
 * replace(user.phone, '-', '')  // REPLACE(user.phone, '-', '')
 * ```
 */
export const replace = fn(sql('REPLACE'))

/**
 * Finds the position of a substring within text.
 * 
 * @param args - The text to search and the substring to find
 * @returns A SQL function node that returns the position (0 if not found)
 * 
 * @example
 * ```ts
 * instr(user.email, '@')  // INSTR(user.email, '@')
 * ```
 */
export const instr = fn(sql('INSTR'))

/**
 * Extracts the date part from a datetime value.
 * 
 * @param args - The datetime expressions to convert
 * @returns A SQL function node that returns the date
 * 
 * @example
 * ```ts
 * date(user.createdAt)  // DATE(user.createdAt)
 * ```
 */
export const date = fn(sql('DATE'))

/**
 * Extracts the time part from a datetime value.
 * 
 * @param args - The datetime expressions to convert
 * @returns A SQL function node that returns the time
 * 
 * @example
 * ```ts
 * time(user.loginAt)  // TIME(user.loginAt)
 * ```
 */
export const time = fn(sql('TIME'))

/**
 * Converts a value to datetime format.
 * 
 * @param args - The expressions to convert to datetime
 * @returns A SQL function node that returns a datetime
 * 
 * @example
 * ```ts
 * dateTime('2024-01-01 12:00:00')  // DATETIME('2024-01-01 12:00:00')
 * ```
 */
export const dateTime = fn(sql('DATETIME'))

/**
 * Formats a datetime using a format string.
 * 
 * @param args - The format string and datetime expression
 * @returns A SQL function node that formats the datetime
 * 
 * @example
 * ```ts
 * strftime('%Y-%m-%d', user.createdAt)  // STRFTIME('%Y-%m-%d', user.createdAt)
 * ```
 */
export const strftime = fn(sql('STRFTIME'))

/**
 * Converts a datetime to Julian day number.
 * 
 * @param args - The datetime expressions to convert
 * @returns A SQL function node that returns the Julian day
 * 
 * @example
 * ```ts
 * julianday(user.birthDate)  // JULIANDAY(user.birthDate)
 * ```
 */
export const julianday = fn(sql('JULIANDAY'))

/**
 * Returns the absolute value of a number.
 * 
 * @param args - The numeric expressions to make absolute
 * @returns A SQL function node that returns the absolute value
 * 
 * @example
 * ```ts
 * abs(user.balance)  // ABS(user.balance)
 * ```
 */
export const abs = fn(sql('ABS'))

/**
 * Rounds a number to the specified decimal places.
 * 
 * @param args - The number and optional decimal places
 * @returns A SQL function node that rounds the number
 * 
 * @example
 * ```ts
 * round(user.score, 2)  // ROUND(user.score, 2)
 * ```
 */
export const round = fn(sql('ROUND'))

/**
 * Rounds a number up to the nearest integer.
 * 
 * @param args - The numeric expressions to round up
 * @returns A SQL function node that rounds up
 * 
 * @example
 * ```ts
 * ceil(user.rating)  // CEIL(user.rating)
 * ```
 */
export const ceil = fn(sql('CEIL'))

/**
 * Rounds a number down to the nearest integer.
 * 
 * @param args - The numeric expressions to round down
 * @returns A SQL function node that rounds down
 * 
 * @example
 * ```ts
 * floor(user.average)  // FLOOR(user.average)
 * ```
 */
export const floor = fn(sql('FLOOR'))

/**
 * Returns the remainder after division (modulo operation).
 * 
 * @param args - The dividend and divisor
 * @returns A SQL function node that returns the remainder
 * 
 * @example
 * ```ts
 * mod(user.id, 10)  // MOD(user.id, 10)
 * ```
 */
export const mod = fn(sql('MOD'))

/**
 * Raises a number to the specified power.
 * 
 * @param args - The base and exponent
 * @returns A SQL function node that calculates the power
 * 
 * @example
 * ```ts
 * pow(user.level, 2)  // POWER(user.level, 2)
 * ```
 */
export const pow = fn(sql('POWER'))

/**
 * Calculates the square root of a number.
 * 
 * @param args - The numeric expressions to calculate square root for
 * @returns A SQL function node that returns the square root
 * 
 * @example
 * ```ts
 * sqrt(user.area)  // SQRT(user.area)
 * ```
 */
export const sqrt = fn(sql('SQRT'))

/**
 * Generates a random number.
 * 
 * @param args - No arguments needed
 * @returns A SQL function node that returns a random number
 * 
 * @example
 * ```ts
 * random()  // RANDOM()
 * ```
 */
export const random = fn(sql('RANDOM'))
```

## src/nodes/values.ts

```typescript
/**
 * Represents a column assignment for UPDATE operations.
 */
export class AssignmentNode extends SqlNode {
  constructor(
    private readonly column: SqlNode,
    private readonly value: SqlNode
  )

  render(params: ParameterReg): SqlString
}

/**
 * Represents a parenthesized list of values for INSERT or IN operations.
 */
export class ValueListNode extends SqlNode {
  constructor(private readonly values: ArrayLike<SqlNode>)

  render(params: ParameterReg): SqlString
}

/**
 * Creates a column assignment for UPDATE operations.
 * 
 * @param column - The column to assign to
 * @param value - The value to assign
 * @returns An assignment node for UPDATE SET clauses
 * 
 * @example
 * ```ts
 * assign('name', 'John')
 * // name = 'John'
 * ```
 */
export const assign = (column: SqlNodeValue, value: SqlNodeValue): SqlNode

/**
 * Creates a parenthesized list of values.
 * 
 * @param values - The values to include in the list
 * @returns A value list node for INSERT VALUES or IN clauses
 * 
 * @example
 * ```ts
 * valueList('John', 25, 'admin')
 * // ('John', 25, 'admin')
 * ```
 */
export const valueList = (...values: SqlNodeValue[]): SqlNode
```

## src/nodes/clauses.ts

```typescript
/**
 * Represents a FROM clause that specifies which tables to query.
 */
export class FromNode extends SqlNode {
  constructor(private readonly tables: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents a JOIN clause for combining tables.
 */
export class JoinNode extends SqlNode {
  constructor(
    private readonly joinType: SqlNode,
    private readonly table: SqlNode,
    private readonly condition?: SqlNode
  )
  render(params: ParameterReg): SqlString
}

/**
 * Represents a SET clause for UPDATE operations.
 */
export class SetNode extends SqlNode {
  constructor(private readonly assignments: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents a WHERE clause for filtering rows.
 */
export class WhereNode extends SqlNode {
  constructor(private readonly conditions: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents a GROUP BY clause for aggregating results.
 */
export class GroupByNode extends SqlNode {
  constructor(private readonly expr: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents a HAVING clause for filtering grouped results.
 */
export class HavingNode extends SqlNode {
  constructor(private readonly conditions: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents an ORDER BY clause for sorting results.
 */
export class OrderByNode extends SqlNode {
  constructor(private readonly expr: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents a LIMIT clause for restricting result count.
 */
export class LimitNode extends SqlNode {
  constructor(private readonly count: SqlNode)
  render(params: ParameterReg): SqlString
}

/**
 * Represents an OFFSET clause for skipping rows in pagination.
 */
export class OffsetNode extends SqlNode {
  constructor(private readonly count: SqlNode)
  render(params: ParameterReg): SqlString
}

/**
 * Represents a VALUES clause for specifying explicit row data.
 */
export class ValuesNode extends SqlNode {
  constructor()
  
  /**
   * Adds a row of values to the VALUES clause.
   * 
   * @param valueList - A value list node containing the row data
   * 
   * @example
   * ```ts
   * valuesNode.addRow(valueList('John', 25))
   * // VALUES ('John', 25)
   * ```
   */
  addRow(valueList: SqlNode): void
  
  render(params: ParameterReg): SqlString
}

/**
 * Represents a RETURNING clause for getting data from modified rows.
 */
export class ReturningNode extends SqlNode {
  constructor(private readonly columns?: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents an ON CONFLICT clause for handling constraint violations.
 */
export class OnConflictNode extends SqlNode {
  constructor(
    private readonly action: SqlNode,
    private readonly targets?: ArrayLike<SqlNode>
  )
  render(params: ParameterReg): SqlString
}

/**
 * Represents an UPSERT clause for INSERT with UPDATE on conflict.
 */
export class UpsertNode extends SqlNode {
  constructor(
    private readonly assignments: ArrayLike<SqlNode>,
    private readonly targets?: ArrayLike<SqlNode>,
    private readonly conditions?: ArrayLike<SqlNode>
  )
  render(params: ParameterReg): SqlString
}

/**
 * Creates a FROM clause specifying which tables to query.
 * 
 * @param tables - The table names to select from
 * @returns A FROM clause node
 * 
 * @example
 * ```ts
 * from('users', 'profiles')
 * // FROM users, profiles
 * ```
 */
export const from = (...tables: SqlNodeValue[]) => new FromNode(tables.map(id))

/**
 * Creates an INNER JOIN clause to combine tables on matching rows.
 * 
 * @param table - The table to join
 * @param condition - The join condition (optional)
 * @returns An INNER JOIN clause node
 * 
 * @example
 * ```ts
 * joinInner('profiles', user.id.eq(profile.userId))
 * // INNER JOIN profiles ON user.id = profile.userId
 * ```
 */
export const joinInner = join(sql('INNER'))

/**
 * Creates a LEFT JOIN clause to include all rows from the left table.
 * 
 * @param table - The table to join
 * @param condition - The join condition (optional)
 * @returns A LEFT JOIN clause node
 * 
 * @example
 * ```ts
 * joinLeft('orders', user.id.eq(order.userId))
 * // LEFT JOIN orders ON user.id = order.userId
 * ```
 */
export const joinLeft = join(sql('LEFT'))

/**
 * Creates a LEFT OUTER JOIN clause (same as LEFT JOIN).
 * 
 * @param table - The table to join
 * @param condition - The join condition (optional)
 * @returns A LEFT OUTER JOIN clause node
 * 
 * @example
 * ```ts
 * joinLeftOuter('comments', post.id.eq(comment.postId))
 * // LEFT OUTER JOIN comments ON post.id = comment.postId
 * ```
 */
export const joinLeftOuter = join(sql('LEFT OUTER'))

/**
 * Creates a CROSS JOIN clause for Cartesian product of tables.
 * 
 * @param table - The table to cross join
 * @returns A CROSS JOIN clause node
 * 
 * @example
 * ```ts
 * joinCross('categories')
 * // CROSS JOIN categories
 * ```
 */
export const joinCross = (table: SqlNodeValue) =>
  new JoinNode(raw(sql('CROSS')), id(table))

/**
 * Creates a WHERE clause for filtering rows based on conditions.
 * 
 * @param conditions - The conditions that must be true
 * @returns A WHERE clause node
 * 
 * @example
 * ```ts
 * where(user.active.eq(true), user.age.gt(18))
 * // WHERE user.active = true AND user.age > 18
 * ```
 */
export const where = (...conditions: SqlNodeValue[]) =>
  new WhereNode(conditions.map(expr))

/**
 * Creates a GROUP BY clause for aggregating results by columns.
 * 
 * @param columns - The columns to group by
 * @returns A GROUP BY clause node
 * 
 * @example
 * ```ts
 * groupBy(user.department, user.role)
 * // GROUP BY user.department, user.role
 * ```
 */
export const groupBy = (...columns: SqlNodeValue[]) =>
  new GroupByNode(columns.map(id))

/**
 * Creates a HAVING clause for filtering grouped results.
 * 
 * @param conditions - The conditions to filter grouped results
 * @returns A HAVING clause node
 * 
 * @example
 * ```ts
 * having(count(user.id).gt(5))
 * // HAVING COUNT(user.id) > 5
 * ```
 */
export const having = (...conditions: SqlNodeValue[]) =>
  new HavingNode(conditions.map(expr))

/**
 * Creates an ORDER BY clause for sorting query results.
 * 
 * @param columns - The columns to sort by
 * @returns An ORDER BY clause node
 * 
 * @example
 * ```ts
 * orderBy(user.name.asc(), user.createdAt.desc())
 * // ORDER BY user.name ASC, user.createdAt DESC
 * ```
 */
export const orderBy = (...columns: SqlNodeValue[]) =>
  new OrderByNode(columns.map(id))

/**
 * Creates a LIMIT clause for restricting the number of results.
 * 
 * @param count - The maximum number of rows to return
 * @returns A LIMIT clause node
 * 
 * @example
 * ```ts
 * limit(10)
 * // LIMIT 10
 * ```
 */
export const limit = (count: SqlNodeValue) => new LimitNode(expr(count))

/**
 * Creates an OFFSET clause for skipping rows in pagination.
 * 
 * @param count - The number of rows to skip
 * @returns An OFFSET clause node
 * 
 * @example
 * ```ts
 * offset(20)
 * // OFFSET 20
 * ```
 */
export const offset = (count: SqlNodeValue) => new OffsetNode(expr(count))

/**
 * Creates a RETURNING clause to get data from affected rows.
 * 
 * @param columns - The columns to return (defaults to * if empty)
 * @returns A RETURNING clause node
 * 
 * @example
 * ```ts
 * returning(user.id, user.name)
 * // RETURNING user.id, user.name
 * ```
 */
export const returning = (...columns: SqlNodeValue[]) =>
  new ReturningNode(
    columns && columns.length > 0 ? columns.map(id) : raw('*')
  )

/**
 * Creates a VALUES clause for specifying explicit row data.
 * 
 * @returns A VALUES clause node
 * 
 * @example
 * ```ts
 * values()
 * // VALUES (to be populated with addRow)
 * ```
 */
export const values = () => new ValuesNode()

/**
 * Creates a SET clause for UPDATE operations.
 * 
 * @param assignments - The column assignments
 * @returns A SET clause node
 * 
 * @example
 * ```ts
 * set(user.name.set('John'), user.age.set(25))
 * // SET user.name = 'John', user.age = 25
 * ```
 */
export const set = (...assignments: SqlNodeValue[]) =>
  new SetNode(assignments.map(expr))

/**
 * Creates an ON CONFLICT DO ABORT clause.
 * 
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 * 
 * @example
 * ```ts
 * onConflictAbort('email')
 * // ON CONFLICT (email) DO ABORT
 * ```
 */
export const onConflictAbort = conflict(sql('ABORT'))

/**
 * Creates an ON CONFLICT DO FAIL clause.
 * 
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 * 
 * @example
 * ```ts
 * onConflictFail('username')
 * // ON CONFLICT (username) DO FAIL
 * ```
 */
export const onConflictFail = conflict(sql('FAIL'))

/**
 * Creates an ON CONFLICT DO IGNORE clause.
 * 
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 * 
 * @example
 * ```ts
 * onConflictIgnore('email')
 * // ON CONFLICT (email) DO IGNORE
 * ```
 */
export const onConflictIgnore = conflict(sql('IGNORE'))

/**
 * Creates an ON CONFLICT DO REPLACE clause.
 * 
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 * 
 * @example
 * ```ts
 * onConflictReplace('id')
 * // ON CONFLICT (id) DO REPLACE
 * ```
 */
export const onConflictReplace = conflict(sql('REPLACE'))

/**
 * Creates an ON CONFLICT DO ROLLBACK clause.
 * 
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 * 
 * @example
 * ```ts
 * onConflictRollback('unique_key')
 * // ON CONFLICT (unique_key) DO ROLLBACK
 * ```
 */
export const onConflictRollback = conflict(sql('ROLLBACK'))

/**
 * Creates an ON CONFLICT DO NOTHING clause.
 * 
 * @param targets - The conflict target columns
 * @returns An ON CONFLICT clause node
 * 
 * @example
 * ```ts
 * onConflictNothing('email')
 * // ON CONFLICT (email) DO NOTHING
 * ```
 */
export const onConflictNothing = conflict(sql('NOTHING'))

/**
 * Creates an ON CONFLICT DO UPDATE clause for upsert operations.
 * 
 * @param assignments - The column assignments for the update
 * @param targets - The conflict target columns (optional)
 * @param conditions - Additional WHERE conditions for the update (optional)
 * @returns An UPSERT clause node
 * 
 * @example
 * ```ts
 * onConflictUpdate([user.name.set('John')], ['email'])
 * // ON CONFLICT (email) DO UPDATE SET user.name = 'John'
 * ```
 */
export const onConflictUpdate = (
  assignments: SqlNodeValue[],
  targets?: SqlNodeValue[],
  conditions?: SqlNodeValue[]
) => {
  const _targets: SqlNode[] | undefined = targets?.map(id) ?? undefined
  const _conditions: SqlNode[] | undefined = conditions?.map(expr) ?? undefined

  return new UpsertNode(assignments.map(expr), _targets, _conditions)
}
```

## src/nodes/statements.ts

```typescript
/**
 * Represents a SELECT statement for querying data.
 */
export class SelectNode extends SqlNode {
  constructor(private readonly columns: ArrayLike<SqlNode>)
  render(params: ParameterReg): SqlString
}

/**
 * Represents an INSERT statement for adding new rows.
 */
export class InsertNode extends SqlNode {
  constructor(
    private readonly table: SqlNode,
    private readonly columns: ArrayLike<SqlNode>
  )
  render(params: ParameterReg): SqlString
}

/**
 * Represents an UPDATE statement for modifying existing rows.
 */
export class UpdateNode extends SqlNode {
  constructor(private readonly table: SqlNode)
  render(params: ParameterReg): SqlString
}

/**
 * Represents a DELETE statement for removing rows.
 */
export class DeleteNode extends SqlNode {
  constructor()
  render(params: ParameterReg): SqlString
}

/**
 * Creates a SELECT statement with optional column specification.
 * 
 * @param columns - The columns to select (defaults to * if empty)
 * @returns A SELECT statement node
 * 
 * @example
 * ```ts
 * _select(['name', 'email'])  // SELECT name, email
 * _select()                   // SELECT *
 * ```
 */
export const _select = (columns?: SqlNodeValue[]): SqlNode

/**
 * Creates an UPDATE statement for the specified table.
 * 
 * @param table - The table to update
 * @returns An UPDATE statement node
 * 
 * @example
 * ```ts
 * _update('users')  // UPDATE users
 * ```
 */
export const _update = (table: string): SqlNode

/**
 * Creates an INSERT statement with table and column specification.
 * 
 * @param table - The table to insert into
 * @param columns - The columns to insert values into
 * @returns An INSERT statement node
 * 
 * @example
 * ```ts
 * _insert('users', ['name', 'email'])
 * // INSERT INTO users (name, email)
 * ```
 */
export const _insert = (table: string, columns: SqlNodeValue[]): SqlNode

/**
 * Creates a DELETE statement.
 * 
 * @returns A DELETE statement node
 * 
 * @example
 * ```ts
 * _delete()  // DELETE
 * ```
 */
export const _delete = (): SqlNode
```

## src/nodes/ctes.ts

```typescript
/**
 * Represents a Common Table Expression (CTE) for creating temporary named result sets.
 */
export class CteNode extends SqlNode {
  constructor(
    private readonly name: SqlNode,
    private readonly clauses: SqlNode[]
  )
  render(params: ParameterReg): SqlString
}

/**
 * Represents a WITH clause containing one or more CTEs.
 */
export class WithNode extends SqlNode {
  constructor(
    private readonly ctes: ArrayLike<CteNode>,
    private readonly recursive: boolean = false
  )
  render(params: ParameterReg): SqlString
}

/**
 * Creates a Common Table Expression (CTE) with a name and query.
 * 
 * @param name - The name for the CTE
 * @param query - The query nodes that define the CTE
 * @returns A CTE node
 * 
 * @example
 * ```ts
 * cte('active_users', [selectNode, whereNode])
 * // active_users AS (SELECT ... WHERE ...)
 * ```
 */
export const cte = (name: string, query: SqlNodeValue[]): CteNode

/**
 * Creates a WITH clause to define CTEs at the beginning of a query.
 * 
 * @param recursive - Whether to use WITH RECURSIVE
 * @param ctes - The CTE nodes to include
 * @returns A WITH clause node
 * 
 * @example
 * ```ts
 * with_(false, cte1, cte2)
 * // WITH cte1 AS (...), cte2 AS (...)
 * ```
 */
export const with_ = (recursive?: boolean, ...ctes: CteNode[]): WithNode
```

## src/api/column.ts

```typescript
/**
 * Base interface for all column types with common SQL operations.
 */
export interface IColumn<
  TName extends string = string,
  TType extends SqlParam = SqlParam
> {
  /**
   * Applies DISTINCT to remove duplicate values.
   * 
   * @returns The column with DISTINCT modifier
   * 
   * @example
   * ```ts
   * user.city.distinct()  // DISTINCT user.city
   * ```
   */
  distinct(): this

  /**
   * Applies ALL quantifier (opposite of DISTINCT).
   * 
   * @returns The column with ALL quantifier
   * 
   * @example
   * ```ts
   * user.status.all()  // ALL user.status
   * ```
   */
  all(): this

  /**
   * Creates an equality comparison.
   * 
   * @param arg - The value to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.name.eq('John')  // user.name = 'John'
   * ```
   */
  eq(arg: ColumnValue<TType>): SqlNode

  /**
   * Creates a not-equal comparison.
   * 
   * @param arg - The value to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.status.ne('deleted')  // user.status != 'deleted'
   * ```
   */
  ne(arg: ColumnValue<TType>): SqlNode

  /**
   * Creates an IN comparison to check if the value exists in a list.
   * 
   * @param args - The array of values to check against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.role.in(['admin', 'moderator'])  // user.role IN ('admin', 'moderator')
   * ```
   */
  in(args: TType[]): SqlNode

  /**
   * Creates an IS NULL check.
   * 
   * @returns A SQL null check node
   * 
   * @example
   * ```ts
   * user.deletedAt.isNull()  // user.deletedAt IS NULL
   * ```
   */
  isNull(): SqlNode

  /**
   * Creates an IS NOT NULL check.
   * 
   * @returns A SQL not-null check node
   * 
   * @example
   * ```ts
   * user.email.isNotNull()  // user.email IS NOT NULL
   * ```
   */
  isNotNull(): SqlNode

  /**
   * Creates an alias for the column.
   * 
   * @param asName - The alias name
   * @returns A SQL alias node
   * 
   * @example
   * ```ts
   * user.firstName.as('name')  // user.firstName AS name
   * ```
   */
  as(asName: ColumnValue<string>): SqlNode

  /**
   * Creates an assignment for UPDATE operations.
   * 
   * @param arg - The value to assign
   * @returns A SQL assignment node
   * 
   * @example
   * ```ts
   * user.name.set('John')  // user.name = 'John'
   * ```
   */
  set(arg: ColumnValue<TType>): SqlNode

  /**
   * Creates ascending sort order for ORDER BY.
   * 
   * @returns A SQL sort node
   * 
   * @example
   * ```ts
   * user.name.asc()  // user.name ASC
   * ```
   */
  asc(): SqlNode

  /**
   * Creates descending sort order for ORDER BY.
   * 
   * @returns A SQL sort node
   * 
   * @example
   * ```ts
   * user.createdAt.desc()  // user.createdAt DESC
   * ```
   */
  desc(): SqlNode

  /**
   * Counts the number of non-null values in this column.
   * 
   * @returns The column with COUNT function applied
   * 
   * @example
   * ```ts
   * user.email.count()  // COUNT(user.email)
   * ```
   */
  count(): this

  /**
   * Finds the maximum value in this column.
   * 
   * @returns The column with MAX function applied
   * 
   * @example
   * ```ts
   * user.score.max()  // MAX(user.score)
   * ```
   */
  max(): this

  /**
   * Finds the minimum value in this column.
   * 
   * @returns The column with MIN function applied
   * 
   * @example
   * ```ts
   * user.score.min()  // MIN(user.score)
   * ```
   */
  min(): this
}

/**
 * Interface for numeric columns with mathematical operations.
 */
export interface INumberColumn<TName extends string = string>
  extends IColumn<TName, number> {
  /**
   * Creates a greater-than comparison.
   * 
   * @param arg - The value to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.age.gt(18)  // user.age > 18
   * ```
   */
  gt(arg: ColumnValue<number>): SqlNode

  /**
   * Creates a less-than comparison.
   * 
   * @param arg - The value to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.age.lt(65)  // user.age < 65
   * ```
   */
  lt(arg: ColumnValue<number>): SqlNode

  /**
   * Creates a greater-than-or-equal comparison.
   * 
   * @param arg - The value to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.score.ge(100)  // user.score >= 100
   * ```
   */
  ge(arg: ColumnValue<number>): SqlNode

  /**
   * Creates a less-than-or-equal comparison.
   * 
   * @param arg - The value to compare against
   * @returns A SQL comparison node
   * 
   * @example
   * ```ts
   * user.score.le(1000)  // user.score <= 1000
   * ```
   */
  le(arg: ColumnValue<number>): SqlNode

  /**
   * Creates a BETWEEN range comparison.
   * 
   * @param lower - The lower bound (inclusive)
   * @param upper - The upper bound (inclusive)
   * @returns A SQL range comparison node
   * 
   * @example
   * ```ts
   * user.age.between(18, 65)  // user.age BETWEEN 18 AND 65
   * ```
   */
  between(lower: ColumnValue<number>, upper: ColumnValue<number>): SqlNode

  /**
   * Adds a value to the column.
   * 
   * @param arg - The value to add
   * @returns The column with addition applied
   * 
   * @example
   * ```ts
   * user.score.add(10)  // user.score + 10
   * ```
   */
  add(arg: ColumnValue<number>): this

  /**
   * Subtracts a value from the column.
   * 
   * @param arg - The value to subtract
   * @returns The column with subtraction applied
   * 
   * @example
   * ```ts
   * user.balance.sub(100)  // user.balance - 100
   * ```
   */
  sub(arg: ColumnValue<number>): this

  /**
   * Multiplies the column by a value.
   * 
   * @param arg - The value to multiply by
   * @returns The column with multiplication applied
   * 
   * @example
   * ```ts
   * user.hours.mul(15.50)  // user.hours * 15.50
   * ```
   */
  mul(arg: ColumnValue<number>): this

  /**
   * Divides the column by a value.
   * 
   * @param arg - The value to divide by
   * @returns The column with division applied
   * 
   * @example
   * ```ts
   * user.total.div(user.count)  // user.total / user.count
   * ```
   */
  div(arg: ColumnValue<number>): this

  /**
   * Returns the absolute value of the column.
   * 
   * @returns The column with ABS function applied
   * 
   * @example
   * ```ts
   * user.balance.abs()  // ABS(user.balance)
   * ```
   */
  abs(): this

  /**
   * Rounds the column to the specified decimal places.
   * 
   * @param decimals - The number of decimal places (optional)
   * @returns The column with ROUND function applied
   * 
   * @example
   * ```ts
   * user.score.round(2)  // ROUND(user.score, 2)
   * ```
   */
  round(decimals?: ColumnValue<number>): this

  /**
   * Rounds the column up to the nearest integer.
   * 
   * @returns The column with CEIL function applied
   * 
   * @example
   * ```ts
   * user.rating.ceil()  // CEIL(user.rating)
   * ```
   */
  ceil(): this

  /**
   * Rounds the column down to the nearest integer.
   * 
   * @returns The column with FLOOR function applied
   * 
   * @example
   * ```ts
   * user.average.floor()  // FLOOR(user.average)
   * ```
   */
  floor(): this

  /**
   * Returns the square root of the column.
   * 
   * @returns The column with SQRT function applied
   * 
   * @example
   * ```ts
   * user.area.sqrt()  // SQRT(user.area)
   * ```
   */
  sqrt(): this

  /**
   * Returns the remainder after division (modulo).
   * 
   * @param divisor - The divisor value
   * @returns The column with MOD function applied
   * 
   * @example
   * ```ts
   * user.id.mod(10)  // MOD(user.id, 10)
   * ```
   */
  mod(divisor: ColumnValue<number>): this

  /**
   *