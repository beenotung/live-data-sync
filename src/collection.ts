import { Int, ObjectDict } from './types'
import { DBInstance, migrateUp } from 'better-sqlite3-schema'
import { KeyCache } from './key-cache'
import { Statement } from 'better-sqlite3'
import {
  fromSqliteValue,
  SqliteValue,
  SqliteValueType,
  toSqliteValue,
} from './sqlite-value'

function migrate(db: DBInstance) {
  migrateUp({
    db,
    migrations: [
      {
        name: 'create-object',
        up: /* sql */ `
create table if not exists object (
  id integer primary key
, collection_id integer not null references collection(id)
)
`,
        down: `drop table if exists object`,
      },
      {
        name: 'create-object_field',
        up: /* sql */ `
create table if not exists object_field (
  id integer primary key
, object_id integer not null references object(id)
, field_id integer not null references field(id)
, value -- number | string | null
, value_type text -- 'b' | 'o' | null
)
`,
        down: `drop table if exists object_field`,
      },
    ],
  })
}

type ObjectRow = { id: number; collection_id: number }

type ObjectFieldRow = {
  object_id: Int
  field_id: Int
  value: SqliteValue
  value_type: SqliteValueType
}

export class Collection<Data extends Record<string, ObjectDict>> {
  data: Data

  private readonly collectionKey: KeyCache
  private readonly fieldKey: KeyCache

  // for add()
  private insert_object_statement: Statement<[Int]>

  // for update()
  private insert_object_field_statement: Statement<ObjectFieldRow>

  // for delete()
  private delete_object_field_statement: Statement<[Int]>
  private delete_object_statement: Statement<[Int]>

  // for compact()
  private compact_statement: Statement

  constructor(db: DBInstance) {
    this.collectionKey = new KeyCache(db, 'collection')
    this.fieldKey = new KeyCache(db, 'field')
    migrate(db)
    this.insert_object_statement = db.prepare(
      /* sql */
      `insert into object (collection_id) values (?)`,
    )
    this.insert_object_field_statement = db.prepare(
      /* sql */
      `insert into object_field
       (object_id, field_id, value, value_type)
       values
       (:object_id, :field_id, :value, :value_type)
      `,
    )
    this.delete_object_field_statement = db.prepare(
      /* sql */ `delete from object_field where object_id = ?`,
    )
    this.delete_object_statement = db.prepare(
      /* sql */ `delete from object where id = ?`,
    )
    this.compact_statement = db.prepare(/* sql */ `
with list as (
  select object_id, field_id, max(id) as max_id
  from object_field
  group by object_id, field_id
)

delete from object_field where id in (
  select id from object_field
  inner join list
    on object_field.object_id = list.object_id
   and object_field.field_id = list.field_id
   and object_field.id <> list.max_id
)
`)

    const loadAll = (): Data => {
      const select_object_statement = db.prepare(
        /* sql */ `select id, collection_id from object`,
      )

      const select_object_field_statement = db.prepare(/* sql */ `
select object_id, field_id, value, value_type
from object_field
order by id asc
`)

      // collection_name -> (object_id -> object)
      const collection_name_object_dict: Record<string, ObjectDict> = {}

      // collection_id -> (object_id -> object)
      const collection_id_object_dict: Array<ObjectDict> = []

      // field_id -> field_name
      const field_name_list: Array<string> = []

      // object_id -> object
      const object_list: Array<object> = []

      for (const [name, id] of this.collectionKey.entries()) {
        const dict: ObjectDict = {}
        collection_name_object_dict[name] = dict
        collection_id_object_dict[id as number] = dict
      }

      for (const [name, id] of this.fieldKey.entries()) {
        field_name_list[id as number] = name
      }

      for (const row of select_object_statement.iterate() as IterableIterator<ObjectRow>) {
        const object = {}
        object_list[row.id] = object
        collection_id_object_dict[row.collection_id][row.id] = object
      }

      for (const row of select_object_field_statement.iterate() as IterableIterator<ObjectFieldRow>) {
        const object: Record<string, any> = object_list[row.object_id as number]
        const field = field_name_list[row.field_id as number]
        object[field] = fromSqliteValue(row)
      }
      return collection_name_object_dict as Data
    }

    this.compact()

    this.data = loadAll()
  }

  add<K extends keyof Data>(collection: K & string, item: Data[K][number]) {
    const collection_id = this.collectionKey.getId(collection)
    const object_id =
      this.insert_object_statement.run(collection_id).lastInsertRowid
    this.update(collection, object_id, item)
    return object_id
  }

  update<K extends keyof Data>(
    collection: K & string,
    object_id: Int,
    partialItem: Partial<Data[K][number]>,
  ) {
    const data = this.data
    const dict = data[collection] || {}
    const object: any = { ...dict[object_id as number] }
    Object.entries(partialItem).forEach(([field, value]) => {
      const field_id = this.fieldKey.getId(field)
      const row = toSqliteValue(value)
      this.insert_object_field_statement.run({
        object_id,
        field_id,
        value: row.value,
        value_type: row.value_type,
      })
      object[field] = value
    })
    this.data = {
      ...data,
      [collection]: {
        ...dict,
        [object_id as number]: object,
      },
    }
  }

  delete<K extends keyof Data>(collection: K & string, object_id: Int) {
    this.delete_object_field_statement.run(object_id)
    this.delete_object_statement.run(object_id)
    const data = this.data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [object_id as number]: _item, ...dict } = data[collection]
    this.data = {
      ...data,
      [collection]: dict,
    }
  }

  compact() {
    this.compact_statement.run()
  }
}
