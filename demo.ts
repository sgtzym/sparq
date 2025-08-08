import { sparq } from '@sgtzym/sparq'

const user = sparq('user', {
    id: { type: 'INTEGER', primaryKey: true },
    name: { type: 'TEXT' },
    email: { type: 'TEXT', unique: true },
    age: { type: 'INTEGER' },
    score: { type: 'REAL' },
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


// enhancement: automatically determine param types to let this through?
const query2 = user.insert($.email)
    .values('asdf@asdf.de')
    .conflict($.email)
    .upsert($.score.set(0))
    .where(
        $.score.gt(0)
    )

console.log(query2.sql, query2.params)