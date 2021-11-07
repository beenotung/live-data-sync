import { Dict } from './../src/dict'
import { newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { Collection } from '../src/collection'
import { Store } from '../src/store'
import { ObjectDict } from '../src/types'
import { existsSync, unlinkSync } from 'fs'
import { expect } from 'chai'

describe('Dict TestSuit', () => {
  type Config = {
    origin: string
    pathname: string
    version: string
  }
  let collection: Collection<{ config: ObjectDict<Config> }>
  let dict: Dict<'config', Config>
  before(() => {
    let dbFile = join('data', 'dict-test.db')
    if (existsSync(dbFile)) {
      unlinkSync(dbFile)
    }
    let db = newDB({ path: dbFile, migrate: false })
    let store = new Store(db)
    collection = new Collection<{ config: ObjectDict<Config> }>(store)
  })
  it('should initialize dict', () => {
    dict = new Dict<'config', Config>(collection, 'config', {
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.0',
    })
  })
  it('should load dict value', () => {
    expect(dict.get()).deep.equals({
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.0',
    })
  })
  it('update update dict', () => {
    dict.update({ version: '1.0.1' })
    expect(dict.get()).deep.equals({
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.1',
    })
  })
})
