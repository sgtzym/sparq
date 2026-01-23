import { and, as_, count, desc, gt, or } from '~node'
import { albums, artists, test, tracks } from '~test'

const { $: r } = artists
const { $: l } = albums
const { $: t } = tracks

test('SQLite SELECT', [
	{
		name: 'with basic WHERE clause',
		query: tracks
			.select(t.name, t.milliseconds, t.unitPrice)
			.where(t.albumId.eq(1)),
		expected: {
			sql: `
                SELECT
                    tracks.name,
                    tracks.milliseconds,
                    tracks.unitPrice
                FROM
                    tracks
                WHERE
                    tracks.albumId = :p1
            `,
			params: [1],
		},
	},
	{
		name: 'with multiple conditions',
		query: tracks
			.select(t.name, t.composer)
			.where(
				t.milliseconds.gt(200000),
				t.unitPrice.between(0.99, 1.99),
				t.composer.isNotNull(),
			),
		expected: {
			sql: `
                SELECT
                    tracks.name,
                    tracks.composer
                FROM
                    tracks
                WHERE
                    tracks.milliseconds > :p1
                    AND tracks.unitPrice BETWEEN :p2 AND :p3
                    AND tracks.composer IS NOT NULL
            `,
			params: [200000, 0.99, 1.99],
		},
	},
	{
		name: 'with nested OR/AND conditions',
		query: tracks
			.select(t.trackId, t.name)
			.where(
				or(
					and(
						t.genreId.eq(1),
						t.milliseconds.lt(180000),
					),
					and(
						t.genreId.eq(2),
						t.milliseconds.gt(300000),
					),
				),
				t.unitPrice.ge(0.99),
			),
		expected: {
			sql: `
                SELECT
                    tracks.trackId,
                    tracks.name
                FROM
                    tracks
                WHERE
                    ((tracks.genreId = :p1 AND tracks.milliseconds < :p2)
                    OR (tracks.genreId = :p3 AND tracks.milliseconds > :p4))
                    AND tracks.unitPrice >= :p5
            `,
			params: [1, 180000, 2, 300000, 0.99],
		},
	},
	{
		name: 'with INNER JOIN',
		query: albums
			.select(l.title, r.name.as('artist'))
			.join(artists).inner(r.artistId.eq(l.artistId))
			.where(r.name.like('The%')),
		expected: {
			sql: `
                SELECT
                    albums.title,
                    artists.name AS artist
                FROM
                    albums INNER JOIN artists ON artists.artistId = albums.artistId
                WHERE
                    artists.name LIKE :p1
            `,
			params: ['The%'],
		},
	},
	{
		name: 'with LEFT JOIN and NULL check',
		query: albums
			.select(l.albumId, l.title, r.name)
			.join(artists).left(r.artistId.eq(l.artistId))
			.where(r.name.isNull()),
		expected: {
			sql: `
                SELECT
                    albums.albumId,
                    albums.title,
                    artists.name
                FROM
                    albums LEFT JOIN artists ON artists.artistId = albums.artistId
                WHERE
                    artists.name IS NULL
            `,
		},
	},
	{
		name: 'with multi-table JOIN',
		query: tracks
			.select(
				t.name.as('track'),
				l.title.as('album'),
				r.name.as('artist'),
			)
			.join(albums).inner(l.albumId.eq(t.albumId))
			.join(artists).inner(r.artistId.eq(l.artistId))
			.where(t.unitPrice.gt(0.99))
			.orderBy(r.name.asc(), l.title.asc(), t.trackId.asc())
			.limit(10),
		expected: {
			sql: `
                SELECT
                    tracks.name AS track,
                    albums.title AS album,
                    artists.name AS artist
                FROM
                    tracks
                INNER JOIN albums ON albums.albumId = tracks.albumId
                INNER JOIN artists ON artists.artistId = albums.artistId
                WHERE
                    tracks.unitPrice > :p1
                ORDER BY
                    artists.name ASC,
                    albums.title ASC,
                    tracks.trackId ASC
                LIMIT :p2
            `,
			params: [0.99, 10],
		},
	},
	{
		name: 'with aggregation and GROUP BY',
		query: albums
			.select(
				l.artistId,
				as_(count(l.artistId), 'album_count'),
			)
			.groupBy(l.artistId)
			.having(gt(l.artistId.count(), 5))
			.orderBy(desc(l.artistId.count())),
		expected: {
			sql: `
                SELECT
                    albums.artistId,
                    COUNT(albums.artistId) AS album_count
                FROM
                    albums
                GROUP BY
                    albums.artistId
                HAVING
                    COUNT(albums.artistId) > :p1
                ORDER BY
                    COUNT(albums.artistId) DESC
            `,
			params: [5],
		},
	},
	{
		name: 'with calculated fields',
		query: tracks
			.select(
				t.name,
				as_(t.milliseconds.div(1000), 'seconds'),
				as_(t.bytes.div(1048576), 'megabytes'),
				as_(t.unitPrice.mul(1.1), 'price_with_tax'),
			)
			.where(t.albumId.eq(1)),
		expected: {
			sql: `
                SELECT
                    tracks.name,
                    tracks.milliseconds / :p1 AS seconds,
                    tracks.bytes / :p2 AS megabytes,
                    tracks.unitPrice * :p3 AS price_with_tax
                FROM
                    tracks
                WHERE
                    tracks.albumId = :p4
            `,
			params: [1000, 1048576, 1.1, 1],
		},
	},
	{
		name: 'with subquery',
		query: (() => {
			const avgPrice = tracks.select(t.unitPrice.avg())
			return tracks
				.select(t.name, t.unitPrice)
				.where(t.unitPrice.gt(avgPrice))
		})(),
		expected: {
			sql: `
                SELECT
                    tracks.name,
                    tracks.unitPrice
                FROM
                    tracks
                WHERE
                    tracks.unitPrice > (SELECT AVG(tracks.unitPrice) FROM tracks)
            `,
		},
	},
	{
		name: 'with common table expression (CTE)',
		query: (() => {
			const longTracks = tracks
				.select(t.albumId, t.name)
				.where(t.milliseconds.gt(300000))

			return albums
				.select(l.title)
				.with('long_tracks', longTracks)
				.where(l.albumId.in([1, 2, 3]))
		})(),
		expected: {
			sql: `
                WITH
                    long_tracks AS (SELECT tracks.albumId, tracks.name FROM tracks WHERE tracks.milliseconds > :p1)
                SELECT
                    albums.title
                FROM
                    albums
                WHERE
                    albums.albumId IN (:p2, :p3, :p4)
            `,
			params: [300000, 1, 2, 3],
		},
	},
])
