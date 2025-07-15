import { and, eq, gt, lt, select, where } from '@/core/constructors.ts'
import { query } from '@/core/query.ts'

// Test 🪓

const [sql, params] = query(
    select('column1', 'column2'),
    where(
        eq('score', 100),
        and(
            gt('age', '18'),
            lt('age', '30'),
        ),
    ),
    select('*'),
)

console.log(sql, params)
