# SPARQ

A declarative and type-safe SQLite query builder for Deno 🦕 with zero dependencies.  

Sparq makes use of the abstract-syntax-tree (AST) concept to generate a node-tree based on query input, then translates it to parameterized SQL syntax.

API → AST → SQL syntax

> [!WARNING]
> This is a personal project for educational purposes - use at own risk!

## Quick start

```ts
import { sparq, col } from '@sgtzym/sparq'

// 1. Define table data

const users = sparq('users', {
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

// 2. Query table data

const { $ } = user

const query = user.select(
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

// Generated SQL and parameter list
console.log(query.sql, query.params)
```