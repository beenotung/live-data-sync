import { Dict } from './../src/dict'
import { DBInstance, newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { expect } from 'chai'
import { newFreshDB } from './db'

describe('Dict TestSuit', () => {
  type Config = {
    origin: string
    pathname: string
    version: string
  }
  let dbFile: string
  let db: DBInstance
  let dict: Dict<{ config: Config }>
  before(() => {
    dbFile = join('data', 'dict-test.db')
    db = newFreshDB(dbFile)
    dict = new Dict(db)
  })
  it('should initialize new dict', () => {
    expect(dict.data.config).to.be.undefined
    let updatedFields = dict.init('config', {
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.0',
    })
    expect(updatedFields).to.equals(3)
    expect(dict.data.config).deep.equals({
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.0',
    })
  })
  it('should not initialize existing dict', () => {
    expect(dict.data.config).not.to.be.undefined
    let updatedFields = dict.init('config', {
      origin: 'no-origin',
      pathname: 'no-pathname',
      version: 'no-version',
    })
    expect(updatedFields).to.equals(0)
    expect(dict.data.config).deep.equals({
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.0',
    })
  })
  it('update update dict', () => {
    dict.update('config', { version: '1.0.1' })
    expect(dict.data.config).deep.equals({
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.1',
    })
  })
  it('should delete dict', () => {
    expect(dict.data.config).deep.equals({
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.1',
    })
    dict.delete('config')
    expect(dict.data.config).deep.equals({})
  })
  it('should compact by removing replaced dict fields', () => {
    const count_statement = db
      .prepare(`select count(*) from dict_field`)
      .pluck()

    dict.update('config', {
      origin: 'http://localhost:3000',
      pathname: '/api',
      version: '1.0.1',
    })
    const countBeforeUpdate = count_statement.get()

    dict.update('config', { version: '1.0.2', pathname: '/rpc' })
    const countAfterUpdate = count_statement.get()

    expect(countAfterUpdate).to.equals(countBeforeUpdate + 2)

    dict.compact()
    const countAfterCompact = count_statement.get()

    expect(countAfterCompact).to.equals(countBeforeUpdate)
  })
  it('should load previously data from new Dict instance', () => {
    db = newDB({ path: dbFile, migrate: false })
    dict = new Dict(db)
    expect(dict.data.config).to.deep.equals({
      origin: 'http://localhost:3000',
      pathname: '/rpc',
      version: '1.0.2',
    })
  })
})
