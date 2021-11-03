import { Statement } from 'better-sqlite3'
import { DBInstance } from 'better-sqlite3-schema'

export type Int = number | bigint

type Row = {
  id: number
  name: string
}
export class KeyCache {
  private cache = new Map<string, Int>()

  /** @description for getId() */
  private insert_statement: Statement

  constructor(db: DBInstance, table: string) {
    this.insert_statement = db.prepare(`insert into ${table} (name) values (?)`)

    const rows: Row[] = db.prepare(`select id, name from ${table}`).all()
    rows.forEach(row => {
      this.cache.set(row.name, row.id)
    })
  }

  getId(key: string): Int {
    let id = this.cache.get(key)
    if (!id) {
      id = this.insert_statement.run(key).lastInsertRowid
      this.cache.set(key, id)
    }
    return id
  }

  entries() {
    return this.cache.entries()
  }
}
