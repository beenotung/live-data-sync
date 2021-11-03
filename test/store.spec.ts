import { db } from './db'
import { Store } from '../src/store'
import { expect } from 'chai'

describe('Store TestSuit', () => {
  let store: Store
  it('should create store from db', () => {
    store = new Store(db)
  })
  it('should add object', () => {
    let id = store.add('users', { name: 'alice', age: 18 })
    let all = store.loadAll()
    expect(all.users[id as number]).deep.equals({ name: 'alice', age: 18 })
  })
})
