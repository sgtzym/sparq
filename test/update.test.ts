import { or } from '~/nodes/expressions.ts'
import { test } from '~~/test-runner.ts'
import { albums, artists, tracks } from '~~/test-data.ts'

const { $: r } = artists
const { $: l } = albums
const { $: t } = tracks

test('SQLite UPDATE', [
	{
		name: 'with simple SET and WHERE',
		query: artists
			.update([r.name.to('AC⚡DC')])
			.where(r.artistId.eq(1)),
		expected: {
			sql: `
                UPDATE
                    artists
                SET
                    artists.name = :p1
                WHERE
                    artists.artistId = :p2
            `,
			params: ['AC⚡DC', 1],
		},
	},
	{
		name: 'with multiple columns',
		query: tracks
			.update([
				t.unitPrice.to(1.29),
				t.composer.to('Lennon/McCartney'),
			])
			.where(t.trackId.eq(1)),
		expected: {
			sql: `
                UPDATE
                    tracks
                SET
                    tracks.unitPrice = :p1,
                    tracks.composer = :p2
                WHERE
                    tracks.trackId = :p3
            `,
			params: [1.29, 'Lennon/McCartney', 1],
		},
	},
	{
		name: 'with arithmetic operations',
		query: tracks
			.update([
				t.unitPrice.to(t.unitPrice.mul(1.1)),
				t.milliseconds.to(t.milliseconds.add(1000)),
			])
			.where(t.albumId.eq(1)),
		expected: {
			sql: `
                UPDATE
                    tracks
                SET
                    tracks.unitPrice = tracks.unitPrice * :p1,
                    tracks.milliseconds = tracks.milliseconds + :p2
                WHERE
                    tracks.albumId = :p3
            `,
			params: [1.1, 1000, 1],
		},
	},
	{
		name: 'with complex WHERE conditions',
		query: tracks
			.update([t.unitPrice.to(0.99)])
			.where(
				t.unitPrice.gt(1.99),
				or(
					t.genreId.eq(1),
					t.genreId.eq(2),
				),
			),
		expected: {
			sql: `
                UPDATE
                    tracks
                SET
                    tracks.unitPrice = :p1
                WHERE
                    tracks.unitPrice > :p2 AND (tracks.genreId = :p3 OR tracks.genreId = :p4)
            `,
			params: [0.99, 1.99, 1, 2],
		},
	},
	{
		name: 'with RETURNING clause',
		query: albums
			.update([l.title.to(l.title.upper())])
			.where(l.artistId.eq(1))
			.returning(l.albumId, l.title),
		expected: {
			sql: `
                UPDATE
                    albums
                SET
                    albums.title = UPPER(albums.title)
                WHERE
                    albums.artistId = :p1
                RETURNING
                    albums.albumId, albums.title;
            `,
			params: [1],
		},
	},
])
