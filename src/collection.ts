import { Int, ObjectDict } from './types'
import { Store } from './store'
import { DBInstance, migrateUp } from 'better-sqlite3-schema'
import { KeyCache } from './key-cache'

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
, is_json integer not null -- boolean
)
`,
        down: `drop table if exists object_field`,
      },
    ],
  })
}
export class Collection<Data extends Record<string, ObjectDict>> {
  data: Data

  private readonly collectionKey: KeyCache
  private readonly fieldKey: KeyCache

  constructor(private db: DBInstance, private store: Store) {
    this.collectionKey = new KeyCache(db, 'collection')
    this.fieldKey = new KeyCache(db, 'field')
    migrate(db)

    const data = (this.data = {} as Data)
  }

  add<K extends keyof Data>(collection: K & string, item: Data[K][number]) {
    const id = this.store.add(collection, item)
    this.data = {
      ...this.data,
      [collection]: {
        ...this.data[collection],
        [id as number]: item,
      },
    }
    return id
  }

  update<K extends keyof Data>(
    collection: K & string,
    id: Int,
    partialItem: Partial<Data[K][number]>,
  ) {
    this.store.update(id, partialItem)
    const data = this.data
    const dict = data[collection]
    this.data = {
      ...data,
      [collection]: {
        ...dict,
        [id as number]: {
          ...dict[id as number],
          ...partialItem,
        },
      },
    }
  }

  delete<K extends keyof Data>(collection: K & string, id: Int) {
    this.store.delete(id)
    const data = this.data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id as number]: _item, ...dict } = data[collection]
    this.data = {
      ...data,
      [collection]: dict,
    }
  }
}
