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

See the [Wiki](https://github.com/sgtzym/sparq/wiki) for supported SQL features, API reference and
recipes.

## Installation

```bash
deno add jsr:@sgtzym/sparq
```

## Usage

### Define Schemas

```ts
import { sparq, column, type Rec } from '@sgtzym/sparq'

const artists = sparq('artists', {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    name: column.text({ notNull: true }),
})

const albums = sparq('albums', {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    title: column.text({ notNull: true }),
    artistId: column.number({ references: { table: 'artists', column: 'id' } }),
})

// Extract row types from schemas
type Artist = Rec<typeof artists>  // { id: number, name: string }
type Album = Rec<typeof albums>    // { id: number, title: string, artistId: number }
```

### SELECT

```ts
const { $: a } = albums

const query = albums
    .select(a.title, a.artistId)
    .where(a.artistId.eq(1))
    .orderBy(a.title.asc())
    .limit(10)

query.sql    // SELECT title, artistId FROM albums WHERE artistId = :p1 ORDER BY title ASC LIMIT :p2
query.params // [1, 10]
```

### INSERT

```ts
const query = artists
    .insert('name')
    .values('Daft Punk')
    .values('Radiohead')

query.sql    // INSERT INTO artists (name) VALUES (:p1), (:p2)
query.params // ['Daft Punk', 'Radiohead']
```

### UPDATE

```ts
const { $: a } = artists

const query = artists
    .update([a.name.to('AC/DC')])
    .where(a.id.eq(1))

query.sql    // UPDATE artists SET name = :p1 WHERE id = :p2
query.params // ['AC/DC', 1]
```

### DELETE

```ts
const { $: a } = artists

const query = artists
    .delete()
    .where(a.id.eq(1))

query.sql    // DELETE FROM artists WHERE id = :p1
query.params // [1]
```

### JOINs

Use `.q` on columns to add table-qualification when joining multiple tables.

```ts
const { $: r } = artists
const { $: l } = albums

const query = albums
    .select(
        l.title.q,
        r.name.q.as('artist'),
    )
    .join(artists).inner(r.id.q.eq(l.artistId.q))
    .where(r.name.q.like('The%'))

query.sql
// SELECT albums.title, artists.name AS artist
// FROM albums INNER JOIN artists ON artists.id = albums.artistId
// WHERE artists.name LIKE :p1

query.params // ['The%']
```

### Column Operations

```ts
const { $: t } = tracks

// Text
t.name.upper()                  // UPPER(name)
t.name.startsWith('The')       // name LIKE 'The%'
t.name.substr(1, 10)           // SUBSTR(name, 1, 10)

// Numbers
t.price.mul(1.1)               // price * 1.1
t.price.between(5, 20)         // price BETWEEN 5 AND 20
t.price.avg().as('avg_price')  // AVG(price) AS avg_price

// Dates
t.createdAt.year()             // STRFTIME('%Y', createdAt)
t.createdAt.gt(someDate)       // createdAt > :p1

// Aggregation
t.id.count().as('total')       // COUNT(id) AS total
t.price.sum().as('revenue')    // SUM(price) AS revenue
```

### Upsert

```ts
const { $: a } = albums

const query = albums
    .insert('id', 'title', 'artistId')
    .values(1, 'Updated Title', 1)
    .conflict('id').upsert([
        a.title.to('Updated Title'),
    ])

query.sql
// INSERT INTO albums (id, title, artistId) VALUES (:p1, :p2, :p1)
// ON CONFLICT (id) DO UPDATE SET title = :p2
```

### CREATE TABLE

```ts
const query = artists.create()

query.sql
// CREATE TABLE IF NOT EXISTS artists (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL
// );
```
