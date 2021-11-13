import { newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { Collection } from '../../src/collection'
import { measure, measureAndReport } from './helpers'

let learningRate = 0.5

let dbFile = join('data', 'benchmark.db')
let db = newDB({ path: dbFile, migrate: false })

let collection = measureAndReport('load collection', () => new Collection(db))
let n = 0
Object.values(collection.data).forEach(dict => (n += Object.keys(dict).length))
console.log(`loaded ${n} records`)

let post_id = collection.add('posts', { timestamp: Date.now() })

let speed = 1

let batch = () => {
  for (let i = 0; i < speed; i++) {
    collection.update('posts', post_id, {
      timestamp: i,
    })
  }
}
batch = db.transaction(batch)

for (;;) {
  let time = measure(batch) / 1000
  if (time === 0) {
    speed *= 2
    console.log('update speed:', speed, '?')
    continue
  }
  let n = Math.floor(speed)
  let newSpeed = n / time
  speed = speed * (1 - learningRate) + newSpeed * learningRate
  console.log('update speed:', speed)
}

// 90 update/sec
