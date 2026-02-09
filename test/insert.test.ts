import { albums, artists, test, tracks } from '~test'

const { $: r } = artists
const { $: l } = albums

test('SQLite INSERT', [
	{
		name: 'with single artist',
		query: artists
			.insert('artistId', 'name')
			.values(276, 'Daft Punk'),
		expected: {
			sql: `
                INSERT INTO artists (
                    artistId,
                    name
                )
                VALUES
                    (:p1, :p2)
            `,
			params: [276, 'Daft Punk'],
		},
	},
	{
		name: 'with multiple albums',
		query: albums
			.insert('albumId', 'title', 'artistId')
			.values(348, 'Random Access Memories', 276)
			.values(349, 'Discovery', 276),
		expected: {
			sql: `
                INSERT INTO albums (
                    albumId,
                    title,
                    artistId
                )
                VALUES
                    (:p1, :p2, :p3),
                    (:p4, :p5, :p3)
            `,
			params: [348, 'Random Access Memories', 276, 349, 'Discovery'],
		},
	},
	{
		name: 'with track including NULL composer',
		query: tracks
			.insert(
				'trackId',
				'name',
				'albumId',
				'mediaTypeId',
				'genreId',
				'composer',
				'milliseconds',
				'bytes',
				'unitPrice',
			)
			.values(
				3504,
				'Get Lucky',
				348,
				1,
				17,
				null,
				369000,
				14808571,
				1.29,
			),
		expected: {
			sql: `
                INSERT INTO tracks (
                    trackId,
                    name,
                    albumId,
                    mediaTypeId,
                    genreId,
                    composer,
                    milliseconds,
                    bytes,
                    unitPrice
                )
                VALUES
                    (:p1, :p2, :p3, :p4, :p5, :p6, :p7, :p8, :p9)
            `,
			params: [
				3504,
				'Get Lucky',
				348,
				1,
				17,
				null,
				369000,
				14808571,
				1.29,
			],
		},
	},
	{
		name: 'with ON CONFLICT DO NOTHING',
		query: artists
			.insert('artistId', 'name')
			.values(1, 'AC/DC')
			.conflict('artistId').nothing(),
		expected: {
			sql: `
                INSERT INTO artists (
                    artistId,
                    name
                )
                VALUES
                    (:p1, :p2)
                ON CONFLICT (artistId)
                DO NOTHING
            `,
			params: [1, 'AC/DC'],
		},
	},
	{
		name: 'with UPSERT on album',
		query: (() => {
			return albums
				.insert('albumId', 'title', 'artistId')
				.values(1, 'For Those About To Rock We Salute You', 1)
				.conflict('albumId').upsert([
					l.title.to('For Those About To Rock (We Salute You)'),
				])
		})(),
		expected: {
			sql: `
                INSERT INTO albums (
                    albumId,
                    title,
                    artistId
                )
                VALUES
                    (:p1, :p2, :p1)
                ON CONFLICT (albumId)
                DO UPDATE SET title = :p3
            `,
			params: [
				1,
				'For Those About To Rock We Salute You',
				'For Those About To Rock (We Salute You)',
			],
		},
	},
	{
		name: 'with RETURNING clause',
		query: artists
			.insert('name')
			.values('Radiohead')
			.returning(r.artistId, r.name),
		expected: {
			sql: `
                INSERT INTO artists (
                    name
                )
                VALUES
                    (:p1)
                RETURNING
                    artistId,
                    name;
            `,
			params: ['Radiohead'],
		},
	},
	{
		name: 'with bulk track insert and deduplication',
		query: tracks
			.insert(
				'name',
				'albumId',
				'mediaTypeId',
				'genreId',
				'milliseconds',
				'bytes',
				'unitPrice',
			)
			.values('Track 1', 1, 1, 1, 180000, 7200000, 0.99)
			.values('Track 2', 1, 1, 1, 180000, 7200000, 0.99)
			.values('Track 3', 1, 2, 1, 240000, 9600000, 0.99),
		expected: {
			sql: `
                INSERT INTO tracks (
                    name,
                    albumId,
                    mediaTypeId,
                    genreId,
                    milliseconds,
                    bytes,
                    unitPrice
                )
                VALUES
                    (:p1, :p2, :p2, :p2, :p3, :p4, :p5),
                    (:p6, :p2, :p2, :p2, :p3, :p4, :p5),
                    (:p7, :p2, :p8, :p2, :p9, :p10, :p5)
            `,
			params: [
				'Track 1',
				1,
				180000,
				7200000,
				0.99,
				'Track 2',
				'Track 3',
				2,
				240000,
				9600000,
			],
		},
	},
])
