import { newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { Collection } from '../src/collection'
import { Store } from '../src/store'

let learningRate = 0.5

let dbFile = join('data', 'benchmark.db')
let db = newDB({ path: dbFile, migrate: false })
let store = new Store(db)

console.log('loading collection')
let start = Date.now()
let collection = new Collection(store)
let end = Date.now()
console.log('loaded collection in', end - start, 'ms')

start = Date.now()
collection.add('posts', { timestamp: Date.now() })
end = Date.now()

let duration = end - start

let reportInterval = 1000
let nextReport = Date.now() + reportInterval

let batch = (n: number) => {
  start = Date.now()
  for (let i = 0; i < n; i++) {
    collection.add('posts', { timestamp: Date.now() })
  }
  end = Date.now()
  duration = duration * (1 - learningRate) + ((end - start) / n) * learningRate
  if (end > nextReport) {
    console.log()
    console.log('batch:', n)
    console.log('duration:', duration)
    let ops = 1000 / duration
    console.log('ops:', ops)
    nextReport = end + reportInterval
  }
}
batch = db.transaction(batch)

for (;;) {
  let n = Math.floor(Math.random() * 200)
  batch(n)
}
