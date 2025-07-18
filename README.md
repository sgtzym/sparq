# SPARQ ✨

A declarative, type-safe SQLite query builder for TypeScript — made with
[Deno](https://deno.com/) 🦕

## Features

- Type-safe, modular SQL query construction
- Supports all common SQL clauses
- Aggregate functions and alias support
- Composes SQL queries with parameterized values
- Casts parameters to valid types
- Escapes field and table names if needed (e.g. "table 1".column1)

## Usage

Queries are composed by combining clause functions. The query function returns a
SQL string and a list of parameters.

```ts
const [sql, params] = query({...})
```

**Example**

```ts
const [sql, params] = query(
    select(
        'name',
        'milliseconds',
        'bytes',
        'albumid',
    ),
    from('tracks'),
    where(
        eq('albumid', 1),
    ),
)

// SELECT name, milliseconds, bytes, albumid FROM tracks WHERE albumid = 1
```
