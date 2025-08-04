import { sparq } from '~/api/sparq.ts'

const { $ } = sparq

const user = sparq.define('user', {
    name: {
        type: 'TEXT'
    }
})

console.log(
    user.select($`column_1`.toNode())
        .offset(2)
        .groupBy('asd')
        .limit(100)    
        ._()
)