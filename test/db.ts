import DB from 'better-sqlite3-helper'
import { toSafeMode } from 'better-sqlite3-schema'
import { join } from 'path'
import { Store } from '../src/store'

export const db = DB({
  path: join('data', 'sqlite3.db'),
  migrate: false,
})

toSafeMode(db)

let store = new Store(db)

let user_id = store.add('users', { username: 'alice', age: 18 })
console.log({ user_id })

store.update(user_id, { age: 21, gender: 'female' })
store.update(user_id, { age: 22, gender: 'trans' })

// store.delete(user_id)

store.compact()
