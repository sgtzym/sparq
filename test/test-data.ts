import { sparq } from '~/api/sparq.ts'
import { col } from '~/api/column.ts'

export const user = sparq('user', {
    id: col.number(),
    name: col.text(),
    email: col.text(),
    age: col.number(),
    active: col.boolean(),
    score: col.number(),
    membershipStatus: col.text(),
})

export const TEST_DATA = {
    john: {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@denoland.land',
        age: 27,
        active: true,
        score: 226,
        membershipStatus: 'silver',
    },
    jane: {
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@deno.land',
        age: 21,
        active: false,
        score: 3762,
        membershipStatus: 'gold',
    },
}
