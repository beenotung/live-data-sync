import { Statement } from 'better-sqlite3'
import { migrateUp, DBInstance } from 'better-sqlite3-schema'
import { KeyCache, Int } from './key-cache'

export class Store {
  private collectionKey: KeyCache
  private fieldKey: KeyCache
  private insert_object_statement: Statement
  private insert_object_field_statement: Statement
  private delete_object_field_statement: Statement
  private delete_object_statement: Statement
  private compact_statement: Statement

  constructor(db: DBInstance) {
    Store.migrate(db)
    this.collectionKey = new KeyCache(db, 'collection')
    this.fieldKey = new KeyCache(db, 'field')
    this.insert_object_statement = db.prepare(
      `insert into object (collection_id) values (?)`,
    )
    this.insert_object_field_statement = db.prepare(
      `insert into object_field
       (object_id, field_id, value, is_json)
       values
       (:object_id, :field_id, :value, :is_json)`,
    )
    this.delete_object_field_statement = db.prepare(
      `delete from object_field where object_id = ?`,
    )
    this.delete_object_statement = db.prepare(`delete from object where id = ?`)
    this.compact_statement = db.prepare(/* sql */ `
with list as (
select object_id, field_id, max(id) as max_id
from object_field
group by object_id, field_id
having count(*) > 1
)

delete from object_field
where id in (
  select id from object_field
  inner join list
    on object_field.object_id = list.object_id
   and object_field.field_id = list.field_id
   and object_field.id <> list.max_id
)`)
  }

  private static migrate(db: DBInstance) {
    migrateUp({
      db,
      table: 'migrations',
      migrations: [
        {
          name: 'create-collection',
          up: /* sql */ `create table if not exists collection (
  id integer primary key
, name text not null
)`,
          down: `drop table if exists collection`,
        },
        {
          name: 'create-field',
          up: /* sql */ `create table if not exists field (
  id integer primary key
, name text not null
)`,
          down: `drop table if exists field`,
        },
        {
          name: 'create-object_field',
          up: /* sql */ `create table if not exists object (
  id integer primary key
, collection_id integer not null references collection(id)
)`,
          down: `drop table if exists object_field`,
        },
        {
          name: 'create-object',
          up: /* sql */ `create table if not exists object_field (
  id integer primary key
, object_id integer not null references object(id)
, field_id integer not null references field(id)
, value -- number | string | null
, is_json integer not null -- boolean
)`,
          down: `drop table if exists object`,
        },
      ],
    })
  }

  add(collection: string, object: object): Int {
    const collection_id = this.collectionKey.getId(collection)
    const object_id =
      this.insert_object_statement.run(collection_id).lastInsertRowid
    this.update(object_id, object)
    return object_id
  }

  /** @description partial update */
  update(id: Int, object: object) {
    for (const field in object) {
      const field_id = this.fieldKey.getId(field)
      let value = (object as any)[field]
      let is_json = 0
      if (value && typeof value === 'object') {
        is_json = 1
        value = JSON.stringify(value)
      }
      this.insert_object_field_statement.run({
        object_id: id,
        field_id,
        value,
        is_json,
      })
    }
  }

  delete(id: Int) {
    this.delete_object_field_statement.run(id)
    this.delete_object_statement.run(id)
  }

  compact() {
    this.compact_statement.run()
  }
}
