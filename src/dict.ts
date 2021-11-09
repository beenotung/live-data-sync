import { Statement } from 'better-sqlite3'
import { DBInstance, migrateUp } from 'better-sqlite3-schema'
import { KeyCache } from './key-cache'

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
, is_json integer not null -- boolean
)`,
        down: 'drop table if exists dict_field',
      },
    ],
  })
}

export class Dict<Data extends Record<string, object>> {
  data: Data

  private readonly nameKey: KeyCache

  /** @description for update() */
  private readonly insert_dict_field_statement: Statement

  constructor(db: DBInstance) {
    migrate(db)
    this.nameKey = new KeyCache(db, 'dict')
    this.insert_dict_field_statement = db.prepare(
      `insert into dict_field
      (dict_id, field, value, is_json)
      values
      (:dict_id, :field, :value, :is_json)`,
    )
    const select_dict_field_statement = db.prepare(
      `select dict_id, field, value, is_json from dict_field`,
    )
    type Row = { dict_id: number; field: string; value: string; is_json: 1 | 0 }

    // id -> name
    const id_name_map: string[] = []
    for (const [name, id] of this.nameKey.entries()) {
      id_name_map[id as number] = name
    }

    const data = (this.data = {} as Data)
    select_dict_field_statement.all().forEach((row: Row) => {
      const name = id_name_map[row.dict_id] as keyof Data
      const dict: any = data[name] || (data[name] = {} as Data[typeof name])
      dict[row.field] = row.is_json ? JSON.parse(row.value) : row.value
    })
  }

  update<K extends keyof Data>(
    name: K & string,
    partialValue: Partial<Data[K]>,
  ) {
    const dict_id = this.nameKey.getId(name)
    Object.entries(partialValue).forEach(([field, value]) => {
      let is_json = 0
      if (value && typeof value === 'object') {
        is_json = 1
        value = JSON.stringify(value)
      }
      this.insert_dict_field_statement.run({
        dict_id,
        field,
        value,
        is_json,
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
}
