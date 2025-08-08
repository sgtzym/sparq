import { sparq } from '@sgtzym/sparq'
import { select } from '~/nodes/statements.ts'

const userTable = sparq('users', {
    id: 0 as number,
    name: '' as string,
    email: '' as string,
    age: 0 as number,
    score: 0 as number,
    active: true as boolean,
    created: new Date() as Date,
    data: null as Uint8Array | null,
    // metadata: undefined as Record<string, any> | undefined
})

const { $ } = userTable

$.data.avg()

// const query = user.select(
//     // ...$.all(),
//     // ...$.except($.id),
//     // ...$.pk()
// ).where(
//     $.age.ge(18),
//     $.email.like('%@example.com')
// ).orderBy(
//     $.score.desc(),
// ).limit(10)

// console.log(query.sql) // Generated SQL
// console.log(query.params) // Parameterized values


// const query2 = user.insert($.email)
// .values('test@example.com')
// .conflict($.email)
// .upsert(
//     [$.score.set(100)],
//     $.score.gt(0),
//     $.active.eq(1)
// )

// console.log(query2.sql, query2.params)

// WITH top_tracks AS (
//     SELECT trackid, name
//     FROM tracks
//     ORDER BY trackid
//     LIMIT 5
// )
// SELECT * FROM top_tracks;

// const query1 = user
//     .select($.age, $.email)
//     .with(
//         'active_users',
//         select() // ❌ sub-queries...
//     ).limit(10)

// console.log(query1.sql, query1.params)