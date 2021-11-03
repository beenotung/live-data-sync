export type List<T> = {
  dict: Record<number, T>
  next_id: number
}

export function add<T>(list: List<T>, item: T): List<T> {
  return {
    dict: {
      ...list.dict,
      [list.next_id]: item,
    },
    next_id: list.next_id + 1,
  }
}

export function remove<T>(list: List<T>, id: number): List<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [id]: _item, ...dict } = list.dict
  return {
    dict,
    next_id: list.next_id,
  }
}

export function replace<T>(list: List<T>, id: number, item: T): List<T> {
  return {
    dict: {
      ...list.dict,
      [id]: item,
    },
    next_id: list.next_id,
  }
}

export function update<T>(
  list: List<T>,
  id: number,
  item: Partial<T>,
): List<T> {
  return {
    dict: {
      ...list.dict,
      [id]: { ...list.dict[id], ...item },
    },
    next_id: list.next_id,
  }
}
