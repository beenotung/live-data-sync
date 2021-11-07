import { Collection } from './../src/collection'
import { DBInstance, newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { Store } from '../src/store'
import { ObjectDict, Int } from '../src/types'
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
    db = newDB({ path: dbFile, migrate: false })
    store = new Store(db)
    collection = new Collection(store)
  })
  let user_id: Int
  let post_id: Int
  let post_2_id: Int
  it('should add item into collection', () => {
    user_id = collection.add('users', { name: 'alice' })
    post_id = collection.add('posts', { user_id, content: 'Hello World' })
    post_2_id = collection.add('posts', { user_id, content: 'original' })
    expect(collection.data.users[user_id as number]).to.deep.equals({
      name: 'alice',
    })
    expect(collection.data.posts[post_id as number]).to.deep.equals({
      user_id,
      content: 'Hello World',
    })
  })
  it('should update item in collection', () => {
    collection.update('posts', post_2_id, {
      content: 'reply',
      reply_id: post_id,
    })
    expect(collection.data.posts[post_2_id as number]).to.deep.equals({
      user_id,
      content: 'reply',
      reply_id: post_id,
    })
  })
  it('should delete item in collection', () => {
    collection.delete('posts', post_2_id)
    expect(collection.data.posts[post_2_id as number]).to.be.undefined
    expect(collection.data.posts[post_id as number]).not.to.be.undefined
    expect(collection.data.users[user_id as number]).not.to.be.undefined
  })
})
