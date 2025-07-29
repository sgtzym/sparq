# SPARQ ✨

Type-safe SQLite query builder — built on [Deno](https://deno.com/) 🦕

## Overview

SPARQ provides a declarative API for building SQL queries with full type safety. Built specifically for Deno with SQLite support.

**Status**: Under heavy construction! 🧑‍🏭

## Installation

```bash
deno add @sgtzym/sparq
```

## Quick start

```ts
import { sparq, eq, gt } from '@sgtzym/sparq'

// Select with conditions
const [sql, params] = sparq('users')
  .select('id', 'name', 'email')
  .where(eq('status', 'active'), gt('age', 18))
  .build()

// Insert data
const insertQuery = sparq('users')
  .insert({ name: 'John', email: 'john@example.com' })
  .build()

// Update records
const updateQuery = sparq('users')
  .update({ status: 'inactive' })
  .where(eq('id', 123))
  .build()
```

## Key features

- **Type safety**: Full TypeScript support with compile-time validation
- **SQL injection protection**: Automatic parameterization of values
- **Declarative syntax**: Chainable methods for readable query construction
- **SQLite optimized**: Built specifically for SQLite compatibility

## API reference

### Query builders
- `sparq(table).select()` - SELECT queries
- `sparq(table).insert()` - INSERT operations
- `sparq(table).update()` - UPDATE operations  
- `sparq(table).delete()` - DELETE operations

### Operators
- `eq()`, `ne()`, `gt()`, `lt()`, `ge()`, `le()` - Comparison operators
- `and()`, `or()`, `not()` - Logical operators
- `like()`, `in_()` - Pattern matching and list operations

### Aggregates
- `count()`, `sum()`, `avg()`, `min()`, `max()` - Aggregate functions