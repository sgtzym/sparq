import { sparq } from '~/api/sparq.ts'

const user = sparq('user', {
    id: { type: 'INTEGER', primaryKey: true },
    name: { type: 'TEXT' },
    email: { type: 'TEXT' },
    age: { type: 'INTEGER' },
    score: { type: 'REAL' }
})

const { $ } = user // funny shorthand

const query = user
    .update(
        $.email.set('new@test.com'),
        $.age.set(21),
        $.score.set($.score.add(9999)),
    )
    .where(
        $.score.lt(1000)
    )
    .limit(10)

console.log(query.sql, query.params)

// TODO: Bsp. nachbauen von SQLite Tutorial
// TODO: Liste machen mit Features und Zielen
// TODO: Docs (nicht übertreiben!)

const q2 = user.insert(
    user.id
)
.values(123, 'asdasdas', 'asd')
.values(456)
.values(789)

console.log(q2.sql, q2.params)