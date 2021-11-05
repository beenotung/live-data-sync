export type Int = number | bigint

export type ObjectDict<T extends object = object> = Record<number, T>
