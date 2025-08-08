import { sparq } from '@sgtzym/sparq'

const user = sparq('user', {
    id: { type: 'INTEGER', primaryKey: true },
    name: { type: 'TEXT' },
    email: { type: 'TEXT', unique: true },
    age: { type: 'INTEGER' },
    score: { type: 'REAL' },
    active: { type: 'INTEGER' }
})

// 2. Query data

const { $ } = user

const query = user.select(
    // ...$.all(),
    // ...$.except($.id),
    // ...$.pk()
).where(
    $.age.ge(18),
    $.email.like('%@example.com')
).orderBy(
    $.score.desc(),
).limit(10)

console.log(query.sql) // Generated SQL
console.log(query.params) // Parameterized values


const query2 = user.insert($.email)
    .values('test@example.com')
    .conflict($.email)
    .upsert(
        [$.score.set(100)],
        $.score.gt(0),
        $.active.eq(1)
    )

console.log(query2.sql, query2.params)