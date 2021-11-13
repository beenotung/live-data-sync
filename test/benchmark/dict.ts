import { newDB } from 'better-sqlite3-schema'
import { join } from 'path'
import { Dict } from '../../src/dict'
import { measureAndReport, measure } from './helpers'

let learningRate = 0.5

let dbFile = join('data', 'benchmark.db')
let db = newDB({ path: dbFile, migrate: false })

let dict = measureAndReport('load dict', () => new Dict(db))
let n = Object.keys(dict.data).length
console.log(`loaded ${n} records`)

let speed = 1

let batch = () => {
  for (let i = 0; i < speed; i++) {
    dict.update('config', { timestamp: i })
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

// 320k update/sec
