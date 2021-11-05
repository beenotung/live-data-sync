import { Int, ObjectDict } from './types'
import { Store } from './store'

export class Collection<Data extends Record<string, ObjectDict>> {
  data: Data

  constructor(private store: Store) {
    this.data = store.loadAll() as Data
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
    partialItem: Data[K][number],
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
