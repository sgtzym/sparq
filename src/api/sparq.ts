import type { NodeArg } from '~/core/node.ts'
import { SelectBuilder, UpdateBuilder } from '~/api/builders.ts'

export const sparq = {
    select: (...args: NodeArg[]) => new SelectBuilder(args),
    update: (arg: NodeArg) => new UpdateBuilder(arg)
}
