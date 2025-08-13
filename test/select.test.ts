import { testSQL } from '~~/test-runner.ts'
import { user, TEST_DATA } from '~~/test-data.ts'

const { $ } = user

testSQL('SELECT', [
    {
        name: 'all columns',
        query: user.select(),
        expected: {
            sql: 'SELECT * FROM user'
        },
    },
    {
        name: 'single column with eq condition',
        query: user.select($.email).where($.id.eq(TEST_DATA.jane.id)),
        expected: {
            sql: 'SELECT user.email FROM user WHERE user.id = :p1',
            params: [TEST_DATA.jane.id],
        },
    },
    {
        name: 'multiple columns with LIKE pattern',
        query: user.select($.name, $.email).where($.name.endsWith('Doe')),
        expected: {
            sql: 'SELECT user.name, user.email FROM user WHERE user.name LIKE :p1',
            params: ['%Doe'],
        },
    },
])
