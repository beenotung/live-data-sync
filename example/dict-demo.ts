import { newDB } from 'better-sqlite3-schema'

let db = newDB({
  path: 'state.db',
  migrate: false,
})

import { Dict } from 'live-data-sync'

let dict = new Dict<{
  config: {
    version: string
    JWT_SECRET: string
  }
}>(db)

// init values if not exists
dict.init('config', {
  version: '1.0.0',
  JWT_SECRET: process.env.JWT_SECRET!,
})

console.log(dict.data.config.version)
// '1.0.0'

// partial update
dict.update('config', {
  version: '1.0.1',
})

console.log(dict.data.config.version)
// '1.0.1'

dict.delete('config')
console.log(dict.data.config)
// {}
