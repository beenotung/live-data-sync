export function measureAndReport<T>(title: string, fn: () => T): T {
  let start = Date.now()
  let res = fn()
  let end = Date.now()
  let duration = end - start
  console.log(title, 'used', duration, 'ms')
  return res
}

export function measure(fn: () => void): number {
  let start = Date.now()
  fn()
  let end = Date.now()
  let duration = end - start
  return duration
}
