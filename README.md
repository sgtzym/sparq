# SPARQ

A declarative, AST-based and type-safe SQLite query builder for Deno 🦕

## Quick start

```ts
import { sparq } from '@sgtzym/sparq'

// 1. Define table data

const users = sparq('users', {
    id: dataType.number(),
    name: dataType.text(),
    email: dataType.text(),
    age: dataType.number(),
    score: dataType.number(),
    active: dataType.boolean(),
    created: dataType.date(),
    data: dataType.list(),
    metadata: dataType.json()
})

// 2. Query table data

const { $ } = user

const query = user.select(
  $.id,
  $.name,
  $.score.as('points'),
).where(
  $.age.ge(18),
  $.email.like('%@example.com'),
).orderBy(
  $.score.desc(),
).limit(10)

console.log(query.sql, query.params) // Generated SQL and parameter list
```































A declarative and type-safe SQLite query builder for Deno with zero dependencies. Sparq makes use of the abstract-syntax-tree concept (AST) to generate a node-tree based on query input, then translates it to parameterized SQL syntax.

User input ➡️ AST ➡️ SQL syntax

Sparq also provides an easy to use API, that allows most operations directly columns:

```ts
album.album_id.as('album') // album_id AS album
track.score.gt(1000) // score > 1000
```

Or if you prefer ist the classical way:

```ts
as(album.album_id, 'album')
gt(track.score, 1000)
```

Less readable but capable of more complex stuff.

> [!WARNING]
> This is a personal project for educational purposes - use at own risk!

## Features

## Roadmap
- [x] Core AST rendering
- [x] Primitives, 
- [x] Basic clauses and statements
- [x] Table schema definition and schema aware column API
- [ ] UPSERT - added in `v.1.1.0`
- [ ] Subqueries
- [ ] String operations
- [ ] Tests / CI 