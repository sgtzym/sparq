# SPARQ ✨

Type-safe, AST based SQLite query builder for [Deno](https://deno.com/) 🦕

## Features

- Type Safety - Full TypeScript support with compile-time validation
- SQL Injection Protection - Automatic parameter binding
- Chainable API - Fluent method chaining for readable queries
- SQLite Optimized - Built specifically for SQLite compatibility

## Installation

```bash
deno add @sgtzym/sparq
```

## Quick start

### Select rows

```ts
const [sql, params] = sparq('users')
  .select(['id', 'name', 'email'])
  .where(eq('status', 'active'), gt('age', 18))
  .build()

// -> SELECT id, name, email FROM users WHERE status = :p1 AND age > :p2
```
### Insert rows

```ts
const [sql, params] = sparq('users')
  .insert(
    { name: 'John', email: 'john@sparq.com' },
    { name: 'Jane', email: 'jane@sparq.com' }
  )
  .build()

// -> INSERT INTO users (name, email) VALUES (:p1, :p2), (:p3, :p4);
```

### Update rows

```ts
const [sql, params] = sparq('users')
  .update({ status: 'inactive' })
  .where(eq('id', 123))
  .build()

// -> UPDATE users SET status = :p1 WHERE id = :p2
```
### Delete rows

```ts
const [sql, params] = sparq('users')
  .delete()
  .where(eq('status', 'deleted'))
  .build()

// -> DELETE FROM users WHERE status = :p1
```

## API

### Query builders
- `select()` - SELECT queries with optional column specification and `distinct()`, `all()` set quantifiers
- `insert()` - INSERT with automatic column detection
- `update()` - UPDATE with field assignments
- `delete()` - DELETE operations

### Operators
- `eq()`, `ne()`, `gt()`, `lt()`, `ge()`, `le()` - Comparison operators
- `and()`, `or()`, `not()` - Logical operators
- `like()`, `in_()` - Pattern matching and list operations
- `exists()`, `isNull()`, `isNotNull()` - Existence checks

### Aggregates
- `count()`, `sum()`, `avg()`, `min()`, `max()` - Aggregate functions with `distinct()`, `all()` set quantifiers

### Clauses

- `where()` - Filter conditions (top-level combined with AND)
- `groupBy()`, having() - Grouping and aggregate filtering
- `orderBy()` - Sorting with `asc()`, `desc()` modifiers
- `limit()`, `offset()` - Result pagination
- `innerJoin()`, `leftJoin()`, `crossJoin()` - Table joins

### Utilities
- `id()`, `val()`, `raw()` - Quoted names, literals and raw SQL strings (use with caution!)
- `alias()` - Column/table aliasing