# SPARQ

![Build](https://github.com/sgtzym/sparq/actions/workflows/build.yml/badge.svg)
[![JSR](https://jsr.io/badges/@sgtzym/sparq)](https://jsr.io/@sgtzym/sparq)
[![JSR Score](https://jsr.io/badges/@sgtzym/sparq/score)](https://jsr.io/@sgtzym/sparq)

SPARQ is a type-safe (TypeScript) query-builder for SQLite3 that transforms fluent API calls to
[Abstract Syntax Trees](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (ASTs) incl. automatic
parameter binding, deduplication and quoting.

- Schema-aware column API with automatic type inference
- AST-based queries - Immutable, reusable and predictable results
- Capable of composing complex queries and subqueries
- Parameter binding, deduplication and naming
- Auto-quotation for qualified names and reserved keywords

## Installation

```bash
deno add @sgtzym/sparq
```

## Usage

### Define Schemas

```ts
export const artists = sparq('artists', {
    id: column.number(), // Use column helper (optional)
    name: column.text(),
})

export const albums = sparq('albums', {
    id: column.number(),
    title: column.text(),
    artistId: column.number(),
    releaseDate: column.date(),
})
```
### Compose Queries

```ts
const { $: artist } = artists // Shortcut for artists.$.<column>
const { $: album } = albums

const query = albums
  .select(
      album.title,
      artist.name.as('artist')
  )
  .join(artists).inner(
    artist.id.eq(album.artistId)
  )
  .where(
    artist.name.like('The%')
  )

console.log(query.sql, query.params)
```

**Output:**
```sql
SELECT albums.title, artists.name AS artist
FROM albums INNER JOIN artists ON artists.id = albums.artistId
WHERE artists.name LIKE :p1
```

**Parameters:**
```json
[ "The%" ]
```