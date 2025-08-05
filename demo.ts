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
        $.age.set(21)
    )
    .toSql()

console.log(sql, params)