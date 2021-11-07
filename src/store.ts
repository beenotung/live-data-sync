import { Statement } from 'better-sqlite3'
import { migrateUp, DBInstance } from 'better-sqlite3-schema'
import { KeyCache } from './key-cache'
import { Int, ObjectDict } from './types'

export class Store {
  private collectionKey: KeyCache
  private fieldKey: KeyCache

  /** @description for add() */
  private insert_object_statement: Statement

  /** @description for update() */
  private insert_object_field_statement: Statement

  /** @description for delete() */
  private delete_object_field_statement: Statement
  private delete_object_statement: Statement

  /** @description for compact() */
  private compact_statement: Statement

  /** @description for loadAll() */
  private select_all_object_statement: Statement
  private select_all_object_field_statement: Statement

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
    this.select_all_object_statement = db.prepare(
      /* sql */ `select id, collection_id from object`,
    )
    this.select_all_object_field_statement = db.prepare(
      /* sql */ `select object_id, field_id, value, is_json from object_field`,
    )
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
          name: 'create-object',
          up: /* sql */ `create table if not exists object (
  id integer primary key
, collection_id integer not null references collection(id)
)`,
          down: `drop table if exists object`,
        },
        {
          name: 'create-object_field',
          up: /* sql */ `create table if not exists object_field (
  id integer primary key
, object_id integer not null references object(id)
, field_id integer not null references field(id)
, value -- number | string | null
, is_json integer not null -- boolean
)`,
          down: `drop table if exists object_field`,
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
    Object.entries(object).forEach(([field, value]) => {
      const field_id = this.fieldKey.getId(field)
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
    })
  }

  delete(id: Int) {
    this.delete_object_field_statement.run(id)
    this.delete_object_statement.run(id)
  }

  compact() {
    this.compact_statement.run()
  }

  loadAll() {
    // collection_id -> collection name
    const collectionNames: string[] = []

    // collection_id -> object_id -> object
    const collection_id_object_dict: Array<ObjectDict> = []

    // collection name -> object_id -> object
    const collection_name_object_dict: Record<string, ObjectDict> = {}

    for (const [name, id] of this.collectionKey.entries()) {
      collectionNames[id as number] = name
      const object_dict: ObjectDict = {}
      collection_id_object_dict[id as number] = object_dict
      collection_name_object_dict[name] = object_dict
    }

    // field_id -> field name
    const fieldNames: string[] = []

    for (const [name, id] of this.fieldKey.entries()) {
      fieldNames[id as number] = name
    }

    // object_id -> object
    const object_dict: ObjectDict = {}

    for (const row of this.select_all_object_statement.iterate()) {
      const object = {}
      const object_id = row.id
      collection_id_object_dict[row.collection_id][object_id] = object
      object_dict[object_id] = object
    }

    for (const row of this.select_all_object_field_statement.iterate()) {
      const object = object_dict[row.object_id] as any
      const field = fieldNames[row.field_id]
      object[field] = row.is_json ? JSON.parse(row.value) : row.value
    }

    return collection_name_object_dict
  }
}
