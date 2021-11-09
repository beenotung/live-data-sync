export type SqliteValueRow = {
  value: SqliteValue
  value_type: SqliteValueType
}

export type SqliteValue = string | number | null

export type SqliteValueType =
  | null // default (string | number)
  | 'b' // boolean (1 | 0)
  | 'o' // object (json)

export function toSqliteValue(value: any): SqliteValueRow {
  if (value === null) {
    return { value, value_type: null }
  }
  switch (typeof value) {
    case 'boolean':
      return { value: value ? 1 : 0, value_type: 'b' }
    case 'object':
      return { value: JSON.stringify(value), value_type: 'o' }
    default:
      return { value, value_type: null }
  }
}

export function fromSqliteValue(row: SqliteValueRow): any {
  switch (row.value_type) {
    case 'b':
      return row.value ? true : false
    case 'o':
      return JSON.parse(row.value as string)
    default:
      return row.value
  }
}
