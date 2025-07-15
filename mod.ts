import {
    and,
    count,
    distinct,
    eq,
    gt,
    lt,
    select,
    top,
    where,
} from '@/core/constructors.ts'
import { query } from '@/core/query.ts'

// Test 🪓

const [sql, params] = query(
    select(distinct(), top(100), 'asdf'),
    where(
        eq('score', 100),
        and(
            gt('age', '18'),
            lt('age', '30'),
        ),
        lt('asdf', 50),
    ),
)

console.log(sql, params)
