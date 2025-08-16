# SPARQ

> A declarative, AST-based and type-safe SQLite query builder for Deno 🦕 - with zero dependencies.

SPARQ’s fluent API uses abstract syntax trees (ASTs) to build complex, parameterized queries - including subqueries and CTEs - while preserving SQLite's full expressivness.

🏗️ Query composition (fluent API) → 🌳 Abstract syntax tree (AST) → 📃 SQLite syntax + parameter list

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