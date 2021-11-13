import { newDB } from 'better-sqlite3-schema'

let db = newDB({
  path: 'state.db',
  migrate: false,
})

import { Collection, Int, ObjectDict } from 'live-data-sync'

let collection = new Collection<{
  users: ObjectDict<{ name: string }>
  posts: ObjectDict<{ user_id: Int; content: string }>
}>(db)

let user_id = collection.add('users', { name: 'alice' })
// 1
let post_id = collection.add('posts', { user_id, content: 'Hello World' })
// 2

console.log(collection.data.posts[post_id as number].content)
// 'Hello World'

// partial update
collection.update('posts', post_id, { content: 'Hi' })

console.log(collection.data.posts[post_id as number])
// { user_id: 1, content: 'Hi' }

collection.delete('posts', post_id)

console.log(collection.data.posts[post_id as number])
// undefined
