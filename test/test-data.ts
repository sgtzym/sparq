import { sparq } from '~/api/sparq.ts'
import { sqlTypes } from '~/api/column.ts'

export const artists = sparq('artists', {
    artistId: sqlTypes.number(),
    name: sqlTypes.text(),
})

export const albums = sparq('albums', {
    albumId: sqlTypes.number(),
    title: sqlTypes.text(),
    artistId: sqlTypes.number(),
    releaseDate: sqlTypes.date(),
})

export const tracks = sparq('tracks', {
    trackId: sqlTypes.number(),
    name: sqlTypes.text(),
    albumId: sqlTypes.number(),
    mediaTypeId: sqlTypes.number(),
    genreId: sqlTypes.number(),
    composer: sqlTypes.text(),
    milliseconds: sqlTypes.number(),
    bytes: sqlTypes.number(),
    unitPrice: sqlTypes.number(),
})
