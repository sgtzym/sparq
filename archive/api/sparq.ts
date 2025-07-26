import type { NodeArg } from '~/core/node.ts'
import { select, update } from '~/api/statements.ts'
import { from } from '~/api/clauses.ts'
import { selectQuery, updateQuery } from '~/api/query.ts'

function sparq(table: string) {
    return {
        select: (columns: string[], ...args: NodeArg[]) =>
            selectQuery(
                select(...columns),
                from(table),
                ...args,
            ),
        update: (...args: NodeArg[]) =>
            updateQuery(
                update(table),
                ...args,
            ),
    }
}

export { sparq }
