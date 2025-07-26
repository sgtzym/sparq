import { sparq } from '~/api/sparq.ts'
import { distinct } from '~/ast-nodes/factories/modifiers.ts'
import { alias, count, eq, like, or } from '@sgtzym/sparq'

console.log(
    sparq
        .select(distinct(), 'id', 'name', 'email', alias(count(distinct('name')), 'row_count'))
        .from('user')
        .where(
            eq('name', 'Jane Doe'),
            or(
                like('name', '%Doe'),
                eq('banned', true)
            )
        )
        .build()
    )