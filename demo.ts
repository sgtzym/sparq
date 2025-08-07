import { sparq } from '~/api/sparq.ts'

const user = sparq('user', {
    id: { type: 'INTEGER', primaryKey: true },
    name: { type: 'TEXT' },
    email: { type: 'TEXT' },
    age: { type: 'INTEGER' },
    score: { type: 'REAL' }
})

const { $ } = user // funny shorthand

const [sql, params] = user
    .update(
        $.email.set('new@test.com'),
        $.age.set(21),
        $.score.set($.score.add(9999)),
    )
    .where(
        $.score.lt(1000)
    )
    .limit(10)
    .toSql()

console.log(sql, params)

// TODO: Bsp. nachbauen von SQLite Tutorial
// TODO: Liste machen mit Features und Zielen
// TODO: Docs (nicht übertreiben!)