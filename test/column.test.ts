import { albums, test, tracks } from '~test'

const { $: l } = albums
const { $: t } = tracks

test('Column Operations', [
	{
		name: 'with text pattern matching',
		query: tracks
			.select(t.name)
			.where(
				t.name.startsWith('The'),
				t.name.endsWith('Blues'),
				t.name.contains('Love'),
				t.composer.like('%Lennon%McCartney%'),
			),
		expected: {
			sql: `
                SELECT
                    name
                FROM
                    tracks
                WHERE
                    name LIKE :p1 AND
                    name LIKE :p2 AND
                    name LIKE :p3 AND
                    composer LIKE :p4
            `,
			params: ['The%', '%Blues', '%Love%', '%Lennon%McCartney%'],
		},
	},
	{
		name: 'with text transformations',
		query: tracks
			.select(
				t.name.upper().as('TRACK_NAME'),
				t.name.lower().as('track_name'),
				t.name.length().as('name_length'),
				t.composer.trim().as('composer_clean'),
				t.name.substr(1, 20).as('preview'),
			)
			.limit(1),
		expected: {
			sql: `
                SELECT
                    UPPER(name) AS TRACK_NAME,
                    LOWER(name) AS track_name,
                    LENGTH(name) AS name_length,
                    TRIM(composer) AS composer_clean,
                    SUBSTR(name, :p1, :p2) AS preview
                FROM
                    tracks
                LIMIT :p1
            `,
			params: [1, 20],
		},
	},
	{
		name: 'with math functions',
		query: tracks
			.select(
				t.unitPrice.abs().as('absolute'),
				t.bytes.sqrt().as('bytes_sqrt'),
				t.milliseconds.mod(1000).as('millis_remainder'),
				t.unitPrice.pow(2).as('price_squared'),
				t.unitPrice.ceil().as('price_ceil'),
				t.unitPrice.floor().as('price_floor'),
			)
			.limit(1),
		expected: {
			sql: `
                SELECT
                    ABS(unitPrice) AS absolute,
                    SQRT(bytes) AS bytes_sqrt,
                    MOD(milliseconds, :p1) AS millis_remainder,
                    POWER(unitPrice, :p2) AS price_squared,
                    CEIL(unitPrice) AS price_ceil,
                    FLOOR(unitPrice) AS price_floor
                FROM
                    tracks
                LIMIT :p3
            `,
			params: [1000, 2, 1],
		},
	},
	{
		name: 'with aggregation functions',
		query: tracks
			.select(
				t.trackId.count().as('total_tracks'),
				t.milliseconds.sum().as('total_time'),
				t.milliseconds.avg().as('avg_duration'),
				t.unitPrice.max().as('max_price'),
				t.unitPrice.min().as('min_price'),
				t.bytes.sum().div(1073741824).as('total_gb'),
			)
			.where(t.unitPrice.gt(0)),
		expected: {
			sql: `
                SELECT
                    COUNT(trackId) AS total_tracks,
                    SUM(milliseconds) AS total_time,
                    AVG(milliseconds) AS avg_duration,
                    MAX(unitPrice) AS max_price,
                    MIN(unitPrice) AS min_price,
                    SUM(bytes) / :p1 AS total_gb
                FROM
                    tracks
                WHERE
                    unitPrice > :p2
            `,
			params: [1073741824, 0],
		},
	},
	{
		name: 'with date operations',
		query: albums
			.select(
				l.releaseDate.year().as('release_year'),
				l.releaseDate.month().as('release_month'),
				l.releaseDate.day().as('release_day'),
				l.releaseDate.strftime('%Y-%m-%d').as('formatted_date'),
				l.releaseDate.strftime('%W').as('week_number'),
			)
			.where(l.albumId.eq(1)),
		expected: {
			sql: `
                SELECT
                    STRFTIME(:p1, releaseDate) AS release_year,
                    STRFTIME(:p2, releaseDate) AS release_month,
                    STRFTIME(:p3, releaseDate) AS release_day,
                    STRFTIME(:p4, releaseDate) AS formatted_date,
                    STRFTIME(:p5, releaseDate) AS week_number
                FROM
                    albums
                WHERE
                    albumId = :p6
            `,
			params: ['%Y', '%m', '%d', '%Y-%m-%d', '%W', 1],
		},
	},
	{
		name: 'with date comparisons',
		query: albums
			.select(l.title)
			.where(
				l.releaseDate.gt(new Date('2000-01-01')),
				l.releaseDate.between(
					new Date('2000-01-01'),
					new Date('2020-12-31'),
				),
			),
		expected: {
			sql: `
                SELECT
                    title
                FROM
                    albums
                WHERE
                    releaseDate > :p1 AND
                    releaseDate BETWEEN :p1 AND :p2
            `,
			params: ['2000-01-01T00:00:00.000Z', '2020-12-31T00:00:00.000Z'],
		},
	},
	{
		name: 'with DISTINCT values',
		query: tracks
			.select(
				t.composer.distinct().as('unique_composers'),
				t.unitPrice.distinct().count().as('price_variations'),
			),
		expected: {
			sql: `
                SELECT
                    DISTINCT composer AS unique_composers,
                    COUNT(DISTINCT unitPrice) AS price_variations
                FROM
                    tracks
            `,
		},
	},
])
