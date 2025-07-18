import {
    alias,
    all,
    count,
    distinct,
    eq,
    from,
    joinCross,
    joinInner,
    joinLeft,
    limit,
    offset,
    orderBy,
    select,
    where,
    asc,
    desc
} from './src/core/constructors.ts'
import { query } from './src/core/query.ts'

const [sql, params] = query(
    select(distinct(), 't', alias(count(all(), 'asdf', 'aaaaffff'), 'test')),
    from(alias('ttt', 't')),
    joinCross('möpp'),
    joinLeft('aa', eq('a', 'b')),
    limit(10, offset(50)),
    orderBy('snek', asc('asddf'), desc('aaafff'))
)

console.log(sql, params)
