import { sparq } from '~/api/sparq.ts'
import { SQL_DATA_TYPES } from '~/api/column.ts'

export const artists = sparq('artists', {
    artistId: SQL_DATA_TYPES.number(),
    name: SQL_DATA_TYPES.text(),
})

export const albums = sparq('albums', {
    albumId: SQL_DATA_TYPES.number(),
    title: SQL_DATA_TYPES.text(),
    artistId: SQL_DATA_TYPES.number(),
    releaseDate: SQL_DATA_TYPES.date(),
})

export const tracks = sparq('tracks', {
    trackId: SQL_DATA_TYPES.number(),
    name: SQL_DATA_TYPES.text(),
    albumId: SQL_DATA_TYPES.number(),
    mediaTypeId: SQL_DATA_TYPES.number(),
    genreId: SQL_DATA_TYPES.number(),
    composer: SQL_DATA_TYPES.text(),
    milliseconds: SQL_DATA_TYPES.number(),
    bytes: SQL_DATA_TYPES.number(),
    unitPrice: SQL_DATA_TYPES.number(),
})
