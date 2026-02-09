import { column, sparq } from '~api'
import { test, tracks } from '~test'

const { $: t } = tracks

test('Core Features', [
	{
		name: 'with parameter deduplication',
		query: (() => {
			return tracks
				.select()
				.where(
					t.genreId.eq(1),
					t.mediaTypeId.eq(1),
					t.unitPrice.eq(0.99),
					t.unitPrice.ne(1),
					t.genreId.ne(2),
					t.mediaTypeId.in([1, 2, 3]),
				)
		})(),
		expected: {
			sql: `
                SELECT *
                FROM
                    tracks
                WHERE
                    genreId = :p1 AND
                    mediaTypeId = :p1 AND
                    unitPrice = :p2 AND
                    unitPrice != :p1 AND
                    genreId != :p3 AND
                    mediaTypeId IN (:p1, :p3, :p4)
            `,
			params: [1, 0.99, 2, 3],
		},
	},
	{
		name: 'with identifier quoting for reserved words',
		query: (() => {
			const problematic = sparq('order', {
				select: column.number(),
				from: column.text(),
				where: column.text(),
				normal_column: column.text(),
				'column-with-dash': column.text(),
			})
			const { $ } = problematic
			return problematic
				.select(
					$['select'],
					$['from'],
					$['where'],
					$['normal_column'],
					$['column-with-dash'],
				)
		})(),
		expected: {
			sql: `
                SELECT
                    "select",
                    "from",
                    "where",
                    normal_column,
                    "column-with-dash"
                FROM
                    "order"
            `,
		},
	},
	{
		name: 'with special characters in identifiers',
		query: (() => {
			const special = sparq('user-tracks', {
				'track id': column.number(),
				'track-name': column.text(),
				'track:name': column.text(),
				'123_column': column.number(),
				SELECT: column.text(),
			})
			const { $: s } = special
			return special
				.select(
					s['track id'],
					s['track-name'],
					s['track:name'],
					s['123_column'],
					s['SELECT'],
				)
				.where(s['track id'].eq(1))
		})(),
		expected: {
			sql: `
                SELECT
                    "track id",
                    "track-name",
                    "track:name",
                    "123_column",
                    "SELECT"
                FROM
                    "user-tracks"
                WHERE
                    "track id" = :p1
            `,
			params: [1],
		},
	},
	{
		name: 'with NULL handling',
		query: (() => {
			return tracks
				.insert('composer', 'albumId')
				.values(null, 1)
				.values(undefined, 2) // undefined becomes null
		})(),
		expected: {
			sql: `
                INSERT INTO tracks (
                    composer,
                    albumId
                )
                VALUES
                    (:p1, :p2),
                    (:p1, :p3)
            `,
			params: [null, 1, 2],
		},
	},
	{
		name: 'with boolean conversion',
		query: (() => {
			const settings = sparq('user_settings', {
				userId: column.number(),
				notifications: column.boolean(),
				darkMode: column.boolean(),
			})
			return settings
				.insert('userId', 'notifications', 'darkMode')
				.values(1, true, false)
				.values(2, false, true)
		})(),
		expected: {
			sql: `
                INSERT INTO user_settings (
                    userId,
                    notifications,
                    darkMode
                )
                VALUES
                    (:p1, :p1, :p2),
                    (:p3, :p2, :p1)
            `,
			params: [1, 0, 2], // true=1, false=0, with deduplication
		},
	},
	{
		name: 'with date conversion',
		query: (() => {
			const logs = sparq('logs', {
				id: column.number(),
				timestamp: column.date(),
			})
			const { $: l } = logs
			const date1 = new Date('2024-01-01T12:00:00.000Z')
			const date2 = new Date('2024-01-01T12:00:00.000Z') // Same date
			const date3 = new Date('2024-01-02T12:00:00.000Z')

			return logs
				.select()
				.where(
					l.timestamp.gt(date1),
					l.timestamp.lt(date2), // Same as date1
					l.timestamp.ne(date3),
				)
		})(),
		expected: {
			sql: `
                SELECT *
                FROM
                    logs
                WHERE
                    timestamp > :p1 AND
                    timestamp < :p1 AND
                    timestamp != :p2
            `,
			params: ['2024-01-01T12:00:00.000Z', '2024-01-02T12:00:00.000Z'],
		},
	},
	{
		name: 'with IN operator array values',
		query: (() => {
			const genres = [1, 2, 3, 1, 2] // Contains duplicates

			return tracks
				.select()
				.where(t.genreId.in(genres))
		})(),
		expected: {
			sql: `
                SELECT *
                FROM
                    tracks
                WHERE
                    genreId IN (:p1, :p2, :p3, :p1, :p2)
            `,
			params: [1, 2, 3],
		},
	},
	{
		name: 'with schema prefix',
		query: (() => {
			const qualified = sparq('music.albums', {
				albumId: column.number(),
				title: column.text(),
			})
			const { $ } = qualified
			return qualified
				.select($.albumId, $.title)
				.where($.albumId.eq(1))
		})(),
		expected: {
			sql: `
                SELECT
                    albumId,
                    title
                FROM
                    music.albums
                WHERE
                    albumId = :p1
            `,
			params: [1],
		},
	},
])
