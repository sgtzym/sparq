# SPARQ ✨

A declarative, type-safe SQL query builder for TypeScript — made with
[Deno](https://deno.com/) 🦕

## Usage

```ts
const [sql, params] = new Query(
    from('users'),
    select(
        alias(count('name'), 'age'),
    ),
    where(
        eq('age', 30),
        eq('status', 'approved'),
        or(
            gt('dob', 1990),
            lt('dob', 2000),
        ),
        eq('fraud', false),
    ),
    having(),
).build()
```
