import { sparq } from '@sgtzym/sparq'
import { col } from '~/api/column.ts'

const user = sparq('users', {
    id: col.number(),
    name: col.text(),
    email: col.text(),
    age: col.number(),
    score: col.number(),
    active: col.boolean(),
    created: col.date(),
    data: col.list(),
    metadata: col.json()
})

// 2. Query table data

const { $ } = user

const query = user.select(
  $.id,
  $.name,
  $.score.as('points'),
).where(
  $.age.ge(21),
  $.name.like('Jane%'),
  $.email.endsWith('@doe.com'),
).orderBy(
  $.score.desc(),
).limit(10)

console.log(query.sql, query.params)


const query2 = user.update(
  [$.id.set(123)]
)

console.log(query2.sql, query2.params)