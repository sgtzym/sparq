# Changelog

All notable changes to SPARQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.9.12 - 2026-02-09

### Added

- `.q` getter on columns for explicit table-qualification in JOINs (e.g. `t.name.q`).

### Changed

- Columns now render bare names by default instead of table-qualified names. This fixes
  `"error near '.'"` in UPDATE SET, INSERT, ON CONFLICT and UPSERT statements where SQLite
  rejects table-qualified column names.
- Removed the `InsertNode` workaround that stripped table prefixes by splitting on `.`.
- Updated README with examples for all query types.

### Fixed

- `Sparq` constructor reading old descriptor property names (`__type`/`__options` instead of
  `type`/`opts`), which caused column mixins to not be applied correctly.

## 0.9.11 - 2026-02-08

### Added

- Exported Types and utility functions.

## 0.9.10 - 2026-02-05

### Added

- Foreign key support via `references` (column api).

## 0.9.9 - 2026-01-22

### Fixed

- Types and misc.

## 0.9.8 - 2026-01-22

### Added

- Support for table schema creation with `MY_SPARQ_SCHEMA.create()`
- Infered Types with `type User = Rec<typeof MY_SPARQ_SCHEMA>`

### Changed

- Formatting, Code cleanup
- Imports moved from obscure '~' paths to appropriate barrel exports.

## 0.9.7 - 2026-01-22

### Changed

- Removed table qualified names from `INSERT`statements.

## 0.9.6 - 2025-08-27

### Added

- Support for `UNION`, `INTERSECT` and `EXCEPT` to combine query result sets.

## 0.9.5 - 2025-08-24

### Changed

- Refactored column- and query-builders: Introduced mixins for decluttering and possible expansions.
- Simplified column wrap() method using Object.assign(Object.create()) pattern for better
  maintainability.
- Reduced Docs by a lot and changed to action-oriented speech. Aligned with
  [Microsoft's Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/).

### Fixed

- Added missing return types to conflict and join mixins.

## 0.9.4 - 2025-08-22

### Added

- `CASE WHEN` expressions for conditional logic in queries
- `EXCLUDED` pseudo-table support for UPSERT operations
- Comprehensive API documentation following **Microsoft Writing Style Guide**

### Changed

- Standardized documentation patterns across all modules
- Simplified JSDoc comments to action-oriented language
- Reduced documentation verbosity on self-explanatory methods

## 0.9.3 - 2025-08-18

### Added

- ON CONFLICT clauses (ABORT, FAIL, IGNORE, REPLACE, ROLLBACK, NOTHING)
- UPSERT support with ON CONFLICT DO UPDATE
- RETURNING clause for INSERT, UPDATE, DELETE operations

## 0.9.2

### Added

- Common Table Expressions (CTEs) with WITH clause
- Recursive CTE support
- Subquery support in WHERE conditions

## 0.9.1

### Added

- Math functions (ABS, ROUND, CEIL, FLOOR, MOD, POWER, SQRT)
- String functions (UPPER, LOWER, LENGTH, TRIM, SUBSTR, REPLACE)
- Date/time functions (DATE, TIME, DATETIME, STRFTIME, JULIANDAY)

## 0.9.0

### Added

- Initial release
- Type-safe query builder for SQLite
- Schema-aware column access
- Automatic parameter binding with SQL injection protection
- Support for SELECT, INSERT, UPDATE, DELETE operations
- JOIN operations (INNER, LEFT, LEFT OUTER, CROSS)
- WHERE, GROUP BY, HAVING, OR
