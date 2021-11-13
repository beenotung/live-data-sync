# live-data-sync

Persist and restore the application state. Designed for [web-redux](https://github.com/beenotung/web-redux)

[![npm Package Version](https://img.shields.io/npm/v/live-data-sync.svg?maxAge=3600)](https://www.npmjs.com/package/live-data-sync)

## Features

- Support nested array and object
- Only store incremental update (instead of full snapshot)
- Backed by sqlite in sync mode (which is faster than async mode)
- 100% test coverage
- Using append-only log, with on-demand compaction

## Usage Example

### Create a better-sqlite3 DBInstance

```typescript
import { newDB } from 'better-sqlite3-schema'

let db = newDB({
    path: 'state.db',
    migrate: false,
})
```

### Create a persistent Dict

A dict can contains multiple objects.
Each object is a "singleton" key-value pair.

```typescript
import { Dict } from 'live-data-sync'

let dict = new Dict(db)

// init values if not exists
dict.init('config', {
    version: '1.0.0',
    JWT_SECRET: process.env.JWT_SECRET,
})

dict.data.version // '1.0.0'

// partial update
dict.update('config', {
    version: '1.0.1',
})

dict.data.version // '1.0.1'

dict.delete('config')
dict.data.config // {}
```

### Create a persistent Collection

A collection can contains multiple type of objects.
Each object is an "instance of" key-value pair sharing similar fields of it's type.

```typescript
import { Collection } from 'live-data-sync'

let collection = new Collection(db)

let user_id = collection.add('users', { name: 'alice' })
let post_id = collection.add('posts', { user_id, content: 'Hello World' })

collection.data.posts[post_id as number].content // 'Hello World'

// partial update
collection.update('posts', post_id, { conetnt })
```

For more usage example, refers to [collection.spec.ts](./test/collection.spec.ts) and [dict.spec.ts](./test/dict.spec.ts)

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
