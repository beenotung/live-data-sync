import { DBInstance, newDB } from 'better-sqlite3-schema'
import { existsSync, unlinkSync } from 'fs'

export function newFreshDB(dbFile: string): DBInstance {
  if (existsSync(dbFile)) {
    unlinkSync(dbFile)
  }
  return newDB({ path: dbFile, migrate: false })
}
