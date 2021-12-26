export type Filter = {
  table: string
} & (
  | { id?: number; ids?: never }
  | {
      id?: never
      ids?: number[]
    }
) &
  (
    | { field?: string; fields?: never }
    | {
        field?: never
        fields?: string[]
      }
  )

export type Callback = () => void

export type SubscriptionsIndex = {
  [table: string]: {
    // id | '*'
    [id: number | string]: {
      // field | '*'
      [field: string]: Set<Callback>
    }
  }
}

export const subscriptions: SubscriptionsIndex = {}

export function subscribe(filters: Filter[], callback: Callback) {
  const callbackSets: Array<Set<Callback>> = []

  registerFilter(callbackSets, callback, filters)

  const unsubscribe = () => {
    callbackSets.forEach(set => set.delete(callback))
    callbackSets.length = 0
  }
  return unsubscribe
}

function registerFilter(
  callbackSets: Array<Set<Callback>>,
  callback: Callback,
  filters: Filter[],
) {
  filters.forEach(filter => {
    const table =
      subscriptions[filter.table] || (subscriptions[filter.table] = {})
    if (filter.id) {
      table[filter.id]
      registerFilterId(callbackSets, callback, table, filter.id, filter)
    } else if (filter.ids) {
      filter.ids.forEach(id => {
        registerFilterId(callbackSets, callback, table, id, filter)
      })
    } else {
      registerFilterId(callbackSets, callback, table, '*', filter)
    }
  })
}

function registerFilterId(
  callbackSets: Array<Set<Callback>>,
  callback: Callback,
  table: SubscriptionsIndex[string],
  id: string | number,
  filter: Filter,
) {
  const fields = table[id] || (table[id] = {})
  if (filter.field) {
    registerFilterField(callbackSets, callback, fields, filter.field)
  } else if (filter.fields) {
    filter.fields.forEach(field => {
      registerFilterField(callbackSets, callback, fields, field)
    })
  } else {
    registerFilterField(callbackSets, callback, fields, '*')
  }
}

function registerFilterField(
  callbackSets: Array<Set<Callback>>,
  callback: Callback,
  fields: SubscriptionsIndex[string][number | string],
  field: string,
) {
  const set = fields[field] || (fields[field] = new Set())
  set.add(callback)
  callbackSets.push(set)
}

export function publish(filters: Filter[]) {
  /**
   * Collect callback then call in batch
   *
   * This is to avoid a callback be called multiple times due to matched by multiple matched filter
   *  */
  const callbackSet = new Set<Callback>()

  publishFilter(callbackSet, filters)

  callbackSet.forEach(cb => cb())
}

function publishFilter(callbackSet: Set<Callback>, filters: Filter[]) {
  filters.forEach(filter => {
    const table = subscriptions[filter.table]
    if (!table) return
    if (filter.id) {
      publishFilterId(callbackSet, table, filter.id, filter)
      publishFilterId(callbackSet, table, '*', filter)
    } else if (filter.ids) {
      filter.ids.forEach(id => {
        publishFilterId(callbackSet, table, id, filter)
      })
      publishFilterId(callbackSet, table, '*', filter)
    } else {
      Object.keys(table).forEach(id => {
        publishFilterId(callbackSet, table, id, filter)
      })
    }
  })
}

function publishFilterId(
  callbackSet: Set<Callback>,
  table: SubscriptionsIndex[string],
  id: string | number,
  filter: Filter,
) {
  const fields = table[id]
  if (!fields) return
  if (filter.field) {
    fields[filter.field]?.forEach(cb => callbackSet.add(cb))
    fields['*']?.forEach(cb => callbackSet.add(cb))
  } else if (filter.fields) {
    filter.fields.forEach(field => {
      fields[field]?.forEach(cb => callbackSet.add(cb))
    })
    fields['*']?.forEach(cb => callbackSet.add(cb))
  } else {
    Object.values(fields).filter(set => set.forEach(cb => callbackSet.add(cb)))
  }
}
