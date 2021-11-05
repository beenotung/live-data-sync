import { Collection } from './../src/collection'
import DB from 'better-sqlite3-helper'
import { DBInstance, Int } from 'better-sqlite3-schema'
import { join } from 'path'
import { Store } from '../src/store'
import { ObjectDict } from '../src/types'
import { expect } from 'chai'
import { existsSync, unlinkSync } from 'fs'

describe('Collection TestSuit', () => {
  let dbFile: string
  let db: DBInstance
  let store: Store
  type User = {
    name: string
  }
  type Post = {
    user_id: Int
    content: string
    reply_id?: Int
  }
  let collection: Collection<{
    users: ObjectDict<User>
    posts: ObjectDict<Post>
  }>
  before(() => {
    dbFile = join('data', 'collection-test.db')
    if (existsSync(dbFile)) {
      unlinkSync(dbFile)
    }
    db = DB({ path: dbFile, migrate: false })
    store = new Store(db)
    collection = new Collection(store)
  })
  let user_id: Int
  it('should add item into collection', () => {
    user_id = collection.add('users', { name: 'alice' })
    expect(collection.data.users[user_id as number]).to.deep.contain({
      name: 'alice',
    })
  })
})
