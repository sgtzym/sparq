import { sparq } from '~/api/sparq.ts'
import { SqlType } from '~/api/column.ts'

export const artists = sparq('artists', {
    artistId: SqlType.number(),
    name: SqlType.text(),
})

export const albums = sparq('albums', {
    albumId: SqlType.number(),
    title: SqlType.text(),
    artistId: SqlType.number(),
    releaseDate: SqlType.date(),
})

export const tracks = sparq('tracks', {
    trackId: SqlType.number(),
    name: SqlType.text(),
    albumId: SqlType.number(),
    mediaTypeId: SqlType.number(),
    genreId: SqlType.number(),
    composer: SqlType.text(),
    milliseconds: SqlType.number(),
    bytes: SqlType.number(),
    unitPrice: SqlType.number(),
})
