import { or } from '~node'
import { albums, artists, test, tracks } from '~test'

const { $: r } = artists
const { $: l } = albums
const { $: t } = tracks

test('DELETE Operations', [
	{
		name: 'with simple WHERE',
		query: tracks
			.delete()
			.where(t.trackId.eq(1)),
		expected: {
			sql: `
                DELETE FROM
                    tracks
                WHERE
                    tracks.trackId = :p1
            `,
			params: [1],
		},
	},
	{
		name: 'with multiple conditions',
		query: tracks
			.delete()
			.where(
				t.albumId.eq(1),
				t.milliseconds.lt(180000),
			),
		expected: {
			sql: `
                DELETE FROM
                    tracks
                WHERE
                    tracks.albumId = :p1 AND tracks.milliseconds < :p2
            `,
			params: [1, 180000],
		},
	},
	{
		name: 'with OR conditions',
		query: albums
			.delete()
			.where(
				or(
					l.title.like('%Demo%'),
					l.title.like('%Test%'),
					l.artistId.isNull(),
				),
			),
		expected: {
			sql: `
                DELETE FROM
                    albums
                WHERE
                    (albums.title LIKE :p1 OR albums.title LIKE :p2 OR albums.artistId IS NULL)
            `,
			params: ['%Demo%', '%Test%'],
		},
	},
	{
		name: 'with ORDER BY and LIMIT',
		query: tracks
			.delete()
			.where(t.unitPrice.eq(0))
			.orderBy(t.trackId.asc())
			.limit(100),
		expected: {
			sql: `
                DELETE FROM
                    tracks
                WHERE
                    tracks.unitPrice = :p1
                ORDER BY
                    tracks.trackId ASC
                LIMIT :p2
            `,
			params: [0, 100],
		},
	},
	{
		name: 'with RETURNING all',
		query: artists
			.delete()
			.where(r.name.startsWith('Test'))
			.returning(),
		expected: {
			sql: `
                DELETE FROM
                    artists
                WHERE
                    artists.name LIKE :p1
                RETURNING *;
            `,
			params: ['Test%'],
		},
	},
])
