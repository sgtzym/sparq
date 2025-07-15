import {
    alias,
    and,
    count,
    distinct,
    eq,
    gt,
    like,
    lt,
    select,
    top,
    where,
} from '@/core/constructors.ts'
import { query } from '@/core/query.ts'

// Test 🪓

const [sql, params] = query(
    select(
        top(100),
        distinct(),
        'field1',
        alias('field2', 'test'),
        'field3',
        count('field4'),
        alias(count(distinct(), 'field5'), 'mamboNo5'),
    ),
    where(
        eq('field1', 'active'),
        and(
            gt('field2', 0),
            lt('field2', 99),
        ),
        like('field3', '%test%'),
    ),
)

console.log(sql, params)
