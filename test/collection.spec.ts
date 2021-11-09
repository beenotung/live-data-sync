import { Collection } from './../src/collection'
import { DBInstance, newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { ObjectDict, Int } from '../src/types'
import { expect } from 'chai'
import { newFreshDB } from './db'

describe('Collection TestSuit', () => {
  let dbFile: string
  let db: DBInstance
  type User = {
    name: string
  }
  type Post = {
    user_id: Int
    content: string
    reply_id?: Int
    tags?: string[]
  }
  let collection: Collection<{
    users: ObjectDict<User>
    posts: ObjectDict<Post>
  }>
  before(() => {
    dbFile = join('data', 'collection-test.db')
    db = newFreshDB(dbFile)
  })
  it('should initialize collection', () => {
    collection = new Collection(db)
  })
  let user_id: Int
  let post_id: Int
  let post_2_id: Int
  it('should add item into collection', () => {
    user_id = collection.add('users', { name: 'alice' })
    post_id = collection.add('posts', {
      user_id,
      content: 'Hello World',
      tags: ['apple', 'tree'],
    })
    post_2_id = collection.add('posts', {
      user_id,
      content: 'original',
    })
    expect(collection.data.users[user_id as number]).to.deep.equals({
      name: 'alice',
    })
    expect(collection.data.posts[post_id as number]).to.deep.equals({
      user_id,
      content: 'Hello World',
      tags: ['apple', 'tree'],
    })
    expect(collection.data.posts[post_2_id as number]).to.deep.equals({
      user_id,
      content: 'original',
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
  it('should compact by removing replaced object fields', () => {
    const count_statement = db
      .prepare(`select count(*) from object_field`)
      .pluck()

    post_id = collection.add('posts', {
      user_id,
      content: 'v1',
      tags: ['apple'],
    })
    const countBeforeUpdate = count_statement.get()

    collection.update('posts', post_id, { content: 'v2', tags: ['tree'] })
    const countAfterUpdate = count_statement.get()

    expect(countAfterUpdate).to.equal(countBeforeUpdate + 2)

    collection.compact()
    const countAfterCompact = count_statement.get()

    expect(countAfterCompact).to.equal(countBeforeUpdate)
  })
  it('should load previously data from new Collection instance', () => {
    db = newDB({ path: dbFile, migrate: false })
    collection = new Collection(db)
    expect(collection.data.users[user_id as number]).to.deep.equals({
      name: 'alice',
    })
    expect(collection.data.posts[post_id as number]).to.deep.equals({
      user_id,
      content: 'v2',
      tags: ['tree'],
    })
  })
})
