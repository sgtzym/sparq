import {
    alias,
    and,
    count,
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
        'column1',
        alias('column2', 'test'),
        'column3',
        count('column4'),
        alias(count('column5'), 'mamboNo5'),
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
