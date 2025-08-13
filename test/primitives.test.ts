import { sparq } from '~/api/sparq.ts'
import { col } from '~/api/column.ts'
import { assertSqlEquals } from '~~/utils.ts'
import { or } from '~/nodes/expressions.ts'

Deno.test('SELECT', async (t) => {
    const users = sparq('users', {
        id: col.number(),
        name: col.text(),
        age: col.number(),
        active: col.boolean(),
        'weird column': col.number(),
        status: col.text(),
    })
    const { $ } = users

    await t.step('with all columns', () => {
        assertSqlEquals(users.select(), {
            sql: 'SELECT * FROM users',
        })
    })

    await t.step('with specific columns', () => {
        assertSqlEquals(users.select($.id, $.name), {
            sql: 'SELECT users.id, users.name FROM users',
        })
    })

    await t.step('with column name quoting', () => {
        assertSqlEquals(users.select($.id, $['weird column']), {
            sql: 'SELECT users.id, users."weird column" FROM users',
        })
    })

    await t.step('with conditions', () => {
        const query = users.select($.id, $.name).where(
            $.age.ge(21),
            $.active.eq(true),
        )

        assertSqlEquals(query, {
            sql: 'SELECT users.id, users.name FROM users WHERE users.age >= :p1 AND users.active = :p2',
            params: [21, 1],
        })
    })

    await t.step('with nested conditions', () => {
        const query = users.select($.id, $.name).where(
            $.active.eq(true),
            or(
                $.age.ge(21),
                $.status.eq('verified'),
            ),
        )

        assertSqlEquals(query, {
            sql: 'SELECT users.id, users.name FROM users WHERE users.active = :p1 AND (users.age >= :p2 OR users.status = :p3)',
            params: [1, 21, 'verified'],
        })
    })
})
