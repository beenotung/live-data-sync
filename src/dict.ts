import { Statement } from 'better-sqlite3'
import { DBInstance, migrateUp } from 'better-sqlite3-schema'
import {
  fromSqliteValue,
  SqliteValue,
  SqliteValueType,
  toSqliteValue,
} from './sqlite-value'
import { KeyCache } from './key-cache'
import { Int } from './types'

function migrate(db: DBInstance) {
  migrateUp({
    db,
    table: 'migrations',
    migrations: [
      {
        name: 'create-dict',
        up: /* sql */ `
create table if not exists dict(
  id integer primary key
, name text not null
)`,
        down: `drop table if exists dict`,
      },
      {
        name: 'create-dict_field',
        up: /* sql */ `
create table if not exists dict_field (
  id integer primary key
, dict_id integer not null references dict(id)
, field text not null
, value -- number | string | null
, value_type text -- 'b' | 'o' | null
)`,
        down: 'drop table if exists dict_field',
      },
    ],
  })
}

type DictFieldRow = {
  dict_id: Int
  field: string
  value: SqliteValue
  value_type: SqliteValueType
}

export class Dict<Data extends Record<string, object>> {
  data: Data

  private readonly nameKey: KeyCache

  // for update()
  private readonly insert_dict_field_statement: Statement<DictFieldRow>

  // for delete()
  private readonly delete_dict_field_statement: Statement<[Int]>

  // for compact()
  private compact_statement: Statement

  constructor(db: DBInstance) {
    migrate(db)
    this.nameKey = new KeyCache(db, 'dict')
    this.insert_dict_field_statement = db.prepare(
      /* sql */
      `
insert into dict_field
(dict_id, field, value, value_type)
values
(:dict_id, :field, :value, :value_type)
`,
    )
    this.delete_dict_field_statement = db.prepare(
      /* sql */ `delete from dict_field where dict_id = ?`,
    )
    this.compact_statement = db.prepare(/* sql */ `
with list as (
  select dict_id, field, max(id) as max_id
  from dict_field
  group by dict_id, field
)

delete from dict_field where id in (
  select id from dict_field
  inner join list
    on dict_field.dict_id = list.dict_id
   and dict_field.field = list.field
   and dict_field.id <> list.max_id
)
`)

    const loadAll = (): Data => {
      const select_dict_field_statement = db.prepare(
        /* sql */
        `select dict_id, field, value, value_type
       from dict_field
       order by id asc
      `,
      )

      // id -> dict
      const id_dict_map: object[] = []

      // name -> dict
      const data: Record<string, object> = {}

      for (const [name, id] of this.nameKey.entries()) {
        const dict = {}
        id_dict_map[id as number] = dict
        data[name] = dict
      }

      for (const row of select_dict_field_statement.iterate() as IterableIterator<DictFieldRow>) {
        const dict: any = id_dict_map[row.dict_id as number]
        dict[row.field] = fromSqliteValue(row)
      }

      return data as Data
    }
    this.data = loadAll()
  }

  init<K extends keyof Data>(name: K & string, defaultValue: Data[K]) {
    const dict: any = this.data[name] || {}
    const partialValue: any = {}
    let fieldCount = 0
    Object.entries(defaultValue).forEach(([field, value]) => {
      if (!Object.prototype.hasOwnProperty.call(dict, field)) {
        fieldCount++
        partialValue[field] = value
      }
    })
    if (fieldCount > 0) {
      this.update(name, partialValue)
    }
  }

  update<K extends keyof Data>(
    name: K & string,
    partialValue: Partial<Data[K]>,
  ) {
    const dict_id = this.nameKey.getId(name)
    Object.entries(partialValue).forEach(([field, value]) => {
      const row = toSqliteValue(value)
      this.insert_dict_field_statement.run({
        dict_id,
        field,
        value: row.value,
        value_type: row.value_type,
      })
    })
    const data = this.data
    this.data = {
      ...data,
      [name]: {
        ...data[name],
        ...partialValue,
      },
    }
  }

  delete<K extends keyof Data>(name: K & string) {
    const dict_id = this.nameKey.getId(name)
    this.delete_dict_field_statement.run(dict_id)
    this.data = {
      ...this.data,
      [name]: {},
    }
  }

  compact() {
    this.compact_statement.run()
  }
}
