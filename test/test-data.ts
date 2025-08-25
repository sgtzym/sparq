import { sparq } from '~/api/sparq.ts'
import { column } from '~/api/column.ts'

export const artists = sparq('artists', {
    artistId: column.number(),
    name: column.text(),
})

export const albums = sparq('albums', {
    albumId: column.number(),
    title: column.text(),
    artistId: column.number(),
    releaseDate: column.date(),
})

export const tracks = sparq('tracks', {
    trackId: column.number(),
    name: column.text(),
    albumId: column.number(),
    mediaTypeId: column.number(),
    genreId: column.number(),
    composer: column.text(),
    milliseconds: column.number(),
    bytes: column.number(),
    unitPrice: column.number(),
})
