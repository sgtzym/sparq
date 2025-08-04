# SPARQ ✨

A declarative, AST-based and type-safe SQLite query builder for [Deno](https://deno.com/) 🦕

```ts

// Abstrakte Idee (outside the box): columns immer per $`column` aufrufen und methoden dran chainen? geht das? mit autocompletion? als kompletter ersatz für json.

sparq.user
  .select(
    $`id`.all(),
    $`email`,
    $`name`.distinct(),
    count($`name`).as('name_count')
    $`groupId`.as('group')
  )
  .where(
    $`id`.eq('123')
    or(
      $`b`.lt(100)
      $`c`.between(0, 99)
    )
  )
  .limit(10)
  .offset(10)

sparq.user
  .update(
    $`a`.set('123'),
    $`b`.set(false),
    $`c`.set(null)
  )

sparq.user
  .insert(
    $`a`.default()
    $`b`.set('')
  )
```