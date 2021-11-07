import { Collection } from './collection'
import { Int, ObjectDict } from './types'

export class Dict<K extends string, T extends object> {
  private id: Int | string

  constructor(
    private collection: Collection<Record<K, ObjectDict<T>>>,
    private name: K,
    initialValue: T,
  ) {
    const dict = collection.data[name]
    if (dict) {
      const entry = Object.entries(dict)[0]
      if (entry) {
        this.id = entry[0]
        return
      }
    }
    this.id = collection.add(name, initialValue)
  }

  get(): T {
    return this.collection.data[this.name][this.id as number]
  }

  update(partialValue: Partial<T>) {
    this.collection.update(this.name, this.id as Int, partialValue)
  }
}
