# SPARQ

A declarative and type-safe SQLite query builder for Deno 🦕 with zero dependencies.  

Sparq uses an abstract syntax tree (AST) approach to generate a node-based representation of your queries, then translates them into parameterized SQL. This design provides both safety and flexibility while maintaining readable, composable code.

API → AST → SQL syntax

> [!WARNING]
> This is a personal project for educational purposes - use at own risk!

## Features

- Type-safe schema definitions with column-aware operations
- Automatic SQL injection prevention through parameterization incl. deduplication
- Fluent chainable API for readable query construction
- Full SQL support - CTEs, subqueries, joins, aggregates, window functions
- Smart identifier handling - automatic quoting and keyword escaping
- Conflict resolution - UPSERT and ON CONFLICT strategies
- Zero dependencies - lightweight and self-contained

## Quick start

### 1. Define Your Schema

```ts
const user = sparq('users', {
    id: col.number(),
    name: col.text(),
    email: col.text(),
    age: col.number(),
    score: col.number(),
    active: col.boolean(),
    created: col.date(),
    data: col.list(),
    metadata: col.json()
})
```

### 2. Build Your Queries

```ts
const { $ } = user

const stmt = user.select(
  $.id,
  $.name,
  $.score.as('points'),
).where(
  $.age.ge(21),
  $.name.like('Jane%'),
  $.email.endsWith('@doe.com'),
).orderBy(
  $.score.desc(),
).limit(10)
```

### 3. Execute Your Queries

```ts
console.log(stmt.sql) // Generated SQL
console.log( stmt.params) // Parameter list: [ 21, "Jane%", "%@doe.com", 10 ]
```

The generated SQL is safe, parameterized, and ready to use with any SQLite driver like `node:sqlite` that supports named parameters:

```sql
SELECT users.id, users.name, users.score AS points
FROM users
WHERE users.age >= :p1 AND users.name LIKE :p2 AND users.email LIKE :p3
ORDER BY users.score DESC
LIMIT :p4
```