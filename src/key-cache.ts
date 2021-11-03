import { Statement } from 'better-sqlite3'
import { DBInstance } from 'better-sqlite3-schema'

export type Int = number | bigint

export class KeyCache {
  private cache = new Map<string, Int>()
  private select_statement: Statement
  private insert_statement: Statement

  constructor(db: DBInstance, table: string) {
    this.select_statement = db.prepare(`select id from ${table} where name = ?`)
    this.insert_statement = db.prepare(`insert into ${table} (name) values (?)`)
  }

  getId(key: string): Int {
    if (this.cache.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.cache.get(key)!
    }
    const row = this.select_statement.get(key)
    if (row) {
      const id = row.id
      this.cache.set(key, id)
      return id
    }
    const id = this.insert_statement.run(key).lastInsertRowid
    this.cache.set(key, id)
    return id
  }
}
