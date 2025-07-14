import type { SupportedValueType } from 'node:sqlite'

export interface Rec extends Record<string, SupportedValueType> {
    _id: string
    _createdAt: string
    _updatedAt: string
}
