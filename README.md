# SPARQ ✨

A declarative, type-safe SQL query builder for TypeScript — made with
[Deno](https://deno.com/) 🦕

## Usage

```ts
const [sql, params] = query(
    from('users'),
    select(
        alias(count('field1'), 'f1_count'),
        'field2',
        'field3'
    ),
    where(
        eq('field2', true),
        eq('field3', 'test'),
        or(
            gt('field4', 0),
            lt('field4', 99),
        ),
        like('field5', '%test%')
    )
)
```
