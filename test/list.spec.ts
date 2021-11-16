import { List, ObjectList } from './../src/list'
import { DBInstance, newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { Int } from '../src'
import { expect } from 'chai'
import { newFreshDB } from './db'

describe('List TestSuit', () => {
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
  let list: List<{
    users: ObjectList<User>
    posts: ObjectList<Post>
  }>
  before(() => {
    dbFile = join('data', 'list-test.db')
    db = newFreshDB(dbFile)
  })
  it('should initialize list', () => {
    list = new List(db)
  })
  let user_id: Int
  let post_id: Int
  let post_2_id: Int
  it('should add item into list', () => {
    user_id = list.add('users', { name: 'alice' })
    post_id = list.add('posts', {
      user_id,
      content: 'Hello World',
      tags: ['apple', 'tree'],
    })
    post_2_id = list.add('posts', {
      user_id,
      content: 'original',
    })
    expect(list.data.users.size).to.equals(1)
    expect(list.data.posts.size).to.equals(2)
    expect(list.data.users.dict[user_id as number]).to.deep.equals({
      name: 'alice',
    })
    expect(list.data.posts.dict[post_id as number]).to.deep.equals({
      user_id,
      content: 'Hello World',
      tags: ['apple', 'tree'],
    })
    expect(list.data.posts.dict[post_2_id as number]).to.deep.equals({
      user_id,
      content: 'original',
    })
  })
  it('should update item in list', () => {
    expect(list.data.posts.size).to.equals(2)
    list.update('posts', post_2_id, {
      content: 'reply',
      reply_id: post_id,
    })
    expect(list.data.posts.size).to.equals(2)
    expect(list.data.posts.dict[post_2_id as number]).to.deep.equals({
      user_id,
      content: 'reply',
      reply_id: post_id,
    })
  })
  it('should delete item in list', () => {
    expect(list.data.users.size).to.equals(1)
    expect(list.data.posts.size).to.equals(2)
    list.delete('posts', post_2_id)
    expect(list.data.users.size).to.equals(1)
    expect(list.data.posts.size).to.equals(1)
    expect(list.data.posts.dict[post_2_id as number]).to.be.undefined
    expect(list.data.posts.dict[post_id as number]).not.to.be.undefined
    expect(list.data.users.dict[user_id as number]).not.to.be.undefined
  })
  it('should compact by removing replaced object fields', () => {
    const count_statement = db
      .prepare(`select count(*) from object_field`)
      .pluck()

    post_2_id = list.add('posts', {
      user_id,
      content: 'v1',
      tags: ['apple'],
    })
    const countBeforeUpdate = count_statement.get()

    list.update('posts', post_2_id, { content: 'v2', tags: ['tree'] })
    const countAfterUpdate = count_statement.get()

    expect(countAfterUpdate).to.equal(countBeforeUpdate + 2)

    list.compact()
    const countAfterCompact = count_statement.get()

    expect(countAfterCompact).to.equal(countBeforeUpdate)
  })
  it('should load previously data from new List instance', () => {
    db = newDB({ path: dbFile, migrate: false })
    list = new List(db)
    expect(list.data.users.size).to.equals(1)
    expect(list.data.posts.size).to.equals(2)
    expect(list.data.users.dict[user_id as number]).to.deep.equals({
      name: 'alice',
    })
    expect(list.data.posts.dict[post_id as number]).to.deep.equals({
      user_id,
      content: 'Hello World',
      tags: ['apple', 'tree'],
    })
    expect(list.data.posts.dict[post_2_id as number]).to.deep.equals({
      user_id,
      content: 'v2',
      tags: ['tree'],
    })
  })
})
