import { db } from './db'
import { Store } from '../src/store'
import { expect } from 'chai'
import { Int } from '../src/types'

describe('Store TestSuit', () => {
  let store: Store
  it('should create store from db', () => {
    store = new Store(db)
  })
  let id: Int
  it('should add object', () => {
    id = store.add('users', { name: 'alice', age: 18 })
    const all = store.loadAll()
    expect(all.users[id as number]).deep.equals({ name: 'alice', age: 18 })
  })
  function getUser() {
    const all = store.loadAll()
    const user = all.users[id as number]
    return user as any
  }
  it('should update object', () => {
    store.update(id, { age: 20, version: 2 })
    expect(getUser()).deep.equals({ name: 'alice', age: 20, version: 2 })
  })
  it('should store date as ISO string', () => {
    const date = new Date()
    const text = date.toISOString()
    store.update(id, { date })
    expect(getUser().date).to.equals(text)
  })
  it('should store nested object array', () => {
    store.update(id, { tags: ['test', 'object', { nested: true }] })
    expect(getUser().tags).deep.equals(['test', 'object', { nested: true }])
  })
  it('should delete object by id', () => {
    store.delete(id)
    expect(getUser()).to.be.undefined
  })
  it('should compact by cleaning unused fields', () => {
    const count_statement = db
      .prepare(`select count(*) from object_field`)
      .pluck()
    id = store.add('users', { version: 1 })
    const countBeforeUpdate = count_statement.get()
    store.update(id, { version: 2 })
    const countAfterUpdate = count_statement.get()
    expect(countAfterUpdate).to.equals(countBeforeUpdate + 1)
    store.compact()
    const countAfterCompact = count_statement.get()
    expect(countAfterCompact).to.equals(countBeforeUpdate)
  })
})
