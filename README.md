# SPARQ

> A declarative, AST-based and type-safe SQLite query builder for Deno 🦕 - with zero dependencies.

SPARQ’s fluent API uses abstract syntax trees (ASTs) to build complex, parameterized queries - including subqueries and CTEs - while preserving SQLite's full expressivness.

🏗️ Query composition (fluent API) → 🌳 Abstract syntax tree (AST) → 📃 SQLite syntax + parameter list

```ts
const users = sparq('users', {
    id: col.number(),
    name: col.text(),
    active: col.boolean(),
    created_at: col.date(),
})

const posts = sparq('posts', {
    id: col.number(),
    title: col.text(),
    content: col.text(),
    user_id: col.number(),
    published_at: col.date(),
    view_count: col.number(),
})

const { $: u } = users
const { $: p } = posts

const result = users
    .select(
        u.id,
        u.name,
        p.title,
        p.view_count,
        p.published_at.as('published'),
    )
    .join(posts).left(p.user_id.eq(u.id))
    .where(
        u.active.eq(true),
        p.published_at.gt(new Date('2024-01-01')),
    )
    .orderBy(p.view_count.desc(), p.published_at.desc())
    .limit(20)

console.log(result.sql, result.params)

/**
 * Generated SQL:
 * 
 * SELECT users.id, users.name, posts.title, posts.view_count, posts.published_at AS published
 * FROM users
 * LEFT JOIN posts ON posts.user_id = users.id
 * WHERE users.active = :p1 AND posts.published_at > :p2
 * ORDER BY posts.view_count DESC, posts.published_at DESC
 * LIMIT :p3
 * 
 * Parameter list: [ 1, "2024-01-01T00:00:00.000Z", 20 ]
 */
```

## Features

- **Complex query composition** via easy-to-use fluent API including JOINs, CTEs and subqueries
- **Schema-aware column operations** with readable and type-safe methods
- **Automatic parameter binding** with deduplication and SQL injection protection
- **Auto-quoted identifiers** for qualified table and column names
- **Conflict resolution** with Upsert and ON CONFLICT handling
- **Zero runtime dependencies** - pure TypeScript implementation

## Installation

```bash
deno add @sgtzym/sparq
```