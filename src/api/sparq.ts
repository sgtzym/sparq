import type { NodeArg } from '~/core/node.ts'
import { SelectBuilder } from '~/api/builders.ts'

export const sparq = {
    select: (...args: NodeArg[]) => new SelectBuilder(args),
}
