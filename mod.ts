import { and, eq, ne, not, where } from '@/core/constructors.ts'
import { Query } from '@/core/query.ts'

// Test 🪓

const [sql, params] = new Query(
    undefined,
    where(
        eq('asdf', 100),
        and(
            eq('asdf', 'asdf'),
            and(
                eq('asdasd', 12312321),
                eq('asdasd', 'yeet'),
                not(eq('aasda', 55)),
            ),
        ),
        ne('asd', 123),
    ),
).build()

console.log(sql, params)
