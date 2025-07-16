import {
    alias,
    count,
    crossJoin,
    distinct,
    eq,
    from,
    leftJoin,
    select,
    top,
    where,
} from './src/core/constructors.ts'
import { query } from './src/core/query.ts'

const [sql, params] = query(
    select(distinct(), top(100), alias(count(), 'total')),
    from('table1', leftJoin(), crossJoin()),
    where(
        eq('field1', 'test'),
    ),
)

console.log(sql, params)
