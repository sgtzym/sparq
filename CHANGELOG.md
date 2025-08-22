# Changelog

All notable changes to SPARQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.4] - 2025-08-22

### Added
- `CASE WHEN` expressions for conditional logic in queries
- `EXCLUDED` pseudo-table support for UPSERT operations
- Comprehensive API documentation following Microsoft Writing Style Guide

### Changed
- Simplified JSDoc comments to action-oriented language
- Reduced documentation verbosity on self-explanatory methods
- Standardized documentation patterns across all modules

### Improved
- Type-safe column operations with better IntelliSense support
- Parameter deduplication for more efficient queries
- Error messages for common usage mistakes

## [0.9.3]

### Added
- ON CONFLICT clauses (ABORT, FAIL, IGNORE, REPLACE, ROLLBACK, NOTHING)
- UPSERT support with ON CONFLICT DO UPDATE
- RETURNING clause for INSERT, UPDATE, DELETE operations

## [0.9.2]

### Added
- Common Table Expressions (CTEs) with WITH clause
- Recursive CTE support
- Subquery support in WHERE conditions

## [0.9.1]

### Added
- Math functions (ABS, ROUND, CEIL, FLOOR, MOD, POWER, SQRT)
- String functions (UPPER, LOWER, LENGTH, TRIM, SUBSTR, REPLACE)
- Date/time functions (DATE, TIME, DATETIME, STRFTIME, JULIANDAY)

## [0.9.0]

### Added
- Initial release
- Type-safe query builder for SQLite
- Schema-aware column access
- Automatic parameter binding with SQL injection protection
- Support for SELECT, INSERT, UPDATE, DELETE operations
- JOIN operations (INNER, LEFT, LEFT OUTER, CROSS)
- WHERE, GROUP BY, HAVING, OR