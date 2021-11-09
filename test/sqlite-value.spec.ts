import { DBInstance } from 'better-sqlite3-schema'
import { join } from 'path'
import { newFreshDB } from './db'
import { fromSqliteValue, toSqliteValue } from '../src/sqlite-value'
import { Int } from '../src/types'
import { expect } from 'chai'

describe('sqlite-value.ts TestSuit', () => {
  let db: DBInstance
  before(() => {
    let dbFile = join('data', 'sqlite-value-test.db')
    db = newFreshDB(dbFile)
    db.exec(/* sql */ `
create table data (
  id integer primary key
, value json
, value_type text
)`)
  })

  let valueTuple: Array<[type: string, value: any]> = [
    ['string', 'hello'],
    ['int', 123],
    ['float', 3.14],
    ['boolean true', true],
    ['boolean false', false],
    ['object', { user: 'alice', age: 20 }],
    ['array', [1, 2, 3]],
    ['null', null],
  ]

  valueTuple.forEach(([type, value]) => {
    it(`should support ${type}`, () => {
      let id = db.insert('data', toSqliteValue(value))
      let row = db.queryFirstRow(
        `select value, value_type from data where id = ?`,
        id,
      )
      expect(fromSqliteValue(row as any)).to.deep.equals(value)
    })
  })

  it('should convert date to ISO string', () => {
    let date = new Date()
    let id = db.insert('data', toSqliteValue(date))
    let row = db.queryFirstRow(
      `select value, value_type from data where id = ?`,
      id,
    )
    expect(fromSqliteValue(row as any)).to.equals(date.toISOString())
  })
})
