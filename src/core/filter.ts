import type { Rec } from './rec.ts'

type Comparison<T> = {
    $eq?: T
    $ne?: T
    $gt?: T
    $ge?: T
    $lt?: T
    $le?: T
    $in?: T[]
    $like?: string
    $not?: Comparison<T> | T
}

export type Filter<T extends Rec> =
    & {
        [K in keyof T]?: Comparison<T[K]> | T[K]
    }
    & {
        $and?: ArrayLike<Filter<T>>
        $or?: ArrayLike<Filter<T>>
    }
