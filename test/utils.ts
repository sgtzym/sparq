import { assertEquals } from 'jsr:@std/assert'
import type { SqlQueryBuilder } from '~/api/query-builders.ts'

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()

/**
 * Assert that a query builder produces expected SQL and params
 */
export function assertSqlEquals(
    query: SqlQueryBuilder,
    result: {
        sql: string
        params?: readonly unknown[]
    },
) {
    assertEquals(normalize(query.sql), normalize(result.sql), 'SQL mismatch')
    if (result.params) {
        assertEquals(query.params, result.params, 'Params mismatch')
    }
}
