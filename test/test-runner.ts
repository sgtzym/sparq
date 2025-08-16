import { assertEquals } from 'jsr:@std/assert'
import type { SqlQueryBuilder } from '~/api/query-builders.ts'
import { type ArrayLike, castArray } from '~/core/utils.ts'

interface TestCase {
    name: string
    query: SqlQueryBuilder
    expected: {
        sql: ArrayLike<string>
        params?: readonly unknown[]
    }
}

const normalize = (s: string) =>
    s
        .replace(/\s+/g, ' ')
        .replace(/\( /g, '(')
        .replace(/ \)/g, ')')
        .trim()

export function test(name: string, tests: Array<TestCase>) {
    Deno.test(name, async (t) => {
        for (const test of tests) {
            await t.step(test.name, () => {
                assertEquals(
                    normalize(test.query.sql),
                    normalize(castArray<string>(test.expected.sql).join(' ')),
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
