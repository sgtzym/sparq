import { sparq } from '~/api/sparq.ts'
import { alias, count, isNotNull, or } from '~/factories.ts'

const user = sparq('user', {
    id: { type: 'INTEGER', primaryKey: true },
    name: { type: 'TEXT' },
    email: { type: 'TEXT' },
    age: { type: 'INTEGER' },
    score: { type: 'REAL' }
})

const { $ } = user

const [sql, params] = user.select(
    $.name,
    $.score,
    $.age,
    $.name.as('nime'),
    alias(count(), 'row_count')
).where(
    $.score.eq(1000),
    $.age.between(100, 0),
    or(
        $.name.isNotNull(),
        $.score.gt(1)
    ),
    isNotNull($.name)
).toSql()

console.log(sql, params)

// IDEE: API an Node (Column) drankleben, dann kriege ich die Cross-Ref raus!