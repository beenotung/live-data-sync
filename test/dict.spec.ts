import { Dict } from './../src/dict'
import DB from 'better-sqlite3-helper'
import { join } from 'path'
import { Collection } from '../src/collection'

describe('Dict TestSuit', () => {
  let dict: Dict<>
  before(() => {
    let dbFile = join('data', 'dict-test.db')
    let db = DB({ path: dbFile, migrate: false })
    let collection = new Collection(db)
    dict = new Dict()
  })
  it('should initialize dict', () => {})
})
