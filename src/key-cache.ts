import { Statement } from 'better-sqlite3'
import { DBInstance, migrateUp } from 'better-sqlite3-schema'
import { Int } from './types'

function migrate(db: DBInstance, table: string) {
  migrateUp({
    db,
    migrations: [
      {
        name: `create-${table}`,
        /* sql */
        up: `
create table if not exists ${table} (
  id integer primary key
, name text not null
)`,
        down: `drop table if exists ${table}`,
      },
    ],
  })
}

export class KeyCache {
  private cache = new Map<string, Int>()

  /** @description for getId() */
  private insert_statement: Statement

  constructor(db: DBInstance, table: string) {
    migrate(db, table)
    this.insert_statement = db.prepare(`insert into ${table} (name) values (?)`)

    type Row = {
      id: number
      name: string
    }
    db.prepare(`select id, name from ${table}`)
      .all()
      .forEach((row: Row) => {
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
