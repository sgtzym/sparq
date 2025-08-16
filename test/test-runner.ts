import { assertEquals } from 'jsr:@std/assert'
import type { SqlQueryBuilder } from '~/api/query-builders.ts'

interface TestCase {
    name: string
    query: SqlQueryBuilder
    expected: {
        sql: string
        params?: readonly unknown[]
    }
}

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()

export function test(name: string, tests: Array<TestCase>) {
    Deno.test(name, async (t) => {
        for (const test of tests) {
            await t.step(test.name, () => {
                assertEquals(
                    normalize(test.query.sql),
                    normalize(test.expected.sql),
                    'SQL mismatch',
                )
                if (test.expected.params) {
                    assertEquals(
                        test.query.params,
                        test.expected.params,
                        'Params mismatch',
                    )
                }
            })
        }
    })
}
