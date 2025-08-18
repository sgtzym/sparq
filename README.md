# SPARQ

![Build](https://github.com/sgtzym/sparq/actions/workflows/build.yml/badge.svg)
[![JSR](https://jsr.io/badges/@sgtzym/sparq)](https://jsr.io/@sgtzym/sparq)
[![JSR Score](https://jsr.io/badges/@sgtzym/sparq/score)](https://jsr.io/@sgtzym/sparq)

> A declarative, AST-based and type-safe SQLite query builder for Deno 🦕 - with
> zero dependencies.

SPARQ’s fluent API uses abstract syntax trees (ASTs) to build complex,
parameterized queries - including subqueries and CTEs - while preserving
SQLite's full expressiveness.

**Conversion:** Query composition (fluent API) → Abstract syntax tree (AST) →
SQLite syntax + parameter list

## Features

- **Complex query composition** via easy-to-use fluent API including JOINs, CTEs
  and subqueries
- **Schema-aware column operations** with readable and type-safe methods
- **Automatic parameter binding** with deduplication and SQL injection
  protection
- **Auto-quoted identifiers** for qualified table and column names
- **Conflict resolution** with Upsert and ON CONFLICT handling
- **Zero runtime dependencies** - pure TypeScript implementation

## Installation

```bash
deno add @sgtzym/sparq
```

## Usage

1. Define table schemas with `sparq()`
2. Build queries on set schemas
3. Use `sql` and `params` for prepared statements with any SQLite driver that
   supports named parameters

> [!TIP]
> Columns are exposed via the `$` property.\
> Assign them to local variables to simplify access, especially in JOINs and
> subqueries.

```ts
const artists = sparq('artists', {
    artistId: SqlType.number(),
    name: SqlType.text(),
})

const albums = sparq('albums', {
    albumId: SqlType.number(),
    title: SqlType.text(),
    artistId: SqlType.number(),
    releaseDate: SqlType.date(),
})

const { $: r } = artists
const { $: l } = albums

const my = albums
    .select(l.title, r.name.as('artist'))
    .join(artists).inner(r.artistId.eq(l.artistId))
    .where(r.name.like('The%')),

console.log(my.sql, my.params)
```

**Generated SQL**:

```sql
SELECT
    albums.title,
    artists.name AS artist
FROM
    albums INNER JOIN artists ON artists.artistId = albums.artistId
WHERE
    artists.name LIKE :p1

-- Parameters: [ 'The%' ]
```
