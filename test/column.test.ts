import { test } from '~~/test-runner.ts'
import { albums, artists, tracks } from '~~/test-data.ts'
import { alias, div } from '~/nodes/expressions.ts'
import { count } from '~/nodes/functions.ts'

const { $: r } = artists
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
                    tracks.name
                FROM
                    tracks
                WHERE
                    tracks.name LIKE :p1 AND
                    tracks.name LIKE :p2 AND
                    tracks.name LIKE :p3 AND
                    tracks.composer LIKE :p4
            `,
            params: ['The%', '%Blues', '%Love%', '%Lennon%McCartney%'],
        },
    },
    {
        name: 'with text transformations',
        query: tracks
            .select(
                alias(t.name.upper(), 'TRACK_NAME'),
                alias(t.name.lower(), 'track_name'),
                alias(t.name.length(), 'name_length'),
                alias(t.composer.trim(), 'composer_clean'),
                alias(t.name.substr(1, 20), 'preview'),
            )
            .limit(1),
        expected: {
            sql: `
                SELECT
                    UPPER(tracks.name) AS TRACK_NAME,
                    LOWER(tracks.name) AS track_name,
                    LENGTH(tracks.name) AS name_length,
                    TRIM(tracks.composer) AS composer_clean,
                    SUBSTR(tracks.name, :p1, :p2) AS preview
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
                alias(t.unitPrice.abs(), 'absolute'),
                alias(t.bytes.sqrt(), 'bytes_sqrt'),
                alias(t.milliseconds.mod(1000), 'millis_remainder'),
                alias(t.unitPrice.pow(2), 'price_squared'),
                alias(t.unitPrice.ceil(), 'price_ceil'),
                alias(t.unitPrice.floor(), 'price_floor'),
            )
            .limit(1),
        expected: {
            sql: `
                SELECT
                    ABS(tracks.unitPrice) AS absolute,
                    SQRT(tracks.bytes) AS bytes_sqrt,
                    MOD(tracks.milliseconds, :p1) AS millis_remainder,
                    POWER(tracks.unitPrice, :p2) AS price_squared,
                    CEIL(tracks.unitPrice) AS price_ceil,
                    FLOOR(tracks.unitPrice) AS price_floor
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
                alias(t.trackId.count(), 'total_tracks'),
                alias(t.milliseconds.sum(), 'total_time'),
                alias(t.milliseconds.avg(), 'avg_duration'),
                alias(t.unitPrice.max(), 'max_price'),
                alias(t.unitPrice.min(), 'min_price'),
                alias(div(t.bytes.sum(), 1073741824), 'total_gb'),
            )
            .where(t.unitPrice.gt(0)),
        expected: {
            sql: `
                SELECT
                    COUNT(tracks.trackId) AS total_tracks,
                    SUM(tracks.milliseconds) AS total_time,
                    AVG(tracks.milliseconds) AS avg_duration,
                    MAX(tracks.unitPrice) AS max_price,
                    MIN(tracks.unitPrice) AS min_price,
                    SUM(tracks.bytes) / :p1 AS total_gb
                FROM
                    tracks
                WHERE
                    tracks.unitPrice > :p2
            `,
            params: [1073741824, 0],
        },
    },
    {
        name: 'with date operations',
        query: albums
            .select(
                alias(l.releaseDate.year(), 'release_year'),
                alias(l.releaseDate.month(), 'release_month'),
                alias(l.releaseDate.day(), 'release_day'),
                alias(l.releaseDate.strftime('%Y-%m-%d'), 'formatted_date'),
                alias(l.releaseDate.strftime('%W'), 'week_number'),
            )
            .where(l.albumId.eq(1)),
        expected: {
            sql: `
                SELECT
                    STRFTIME(:p1, albums.releaseDate) AS release_year,
                    STRFTIME(:p2, albums.releaseDate) AS release_month,
                    STRFTIME(:p3, albums.releaseDate) AS release_day,
                    STRFTIME(:p4, albums.releaseDate) AS formatted_date,
                    STRFTIME(:p5, albums.releaseDate) AS week_number
                FROM
                    albums
                WHERE
                    albums.albumId = :p6
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
                    albums.title
                FROM
                    albums
                WHERE
                    albums.releaseDate > :p1 AND
                    albums.releaseDate BETWEEN :p1 AND :p2
            `,
            params: ['2000-01-01T00:00:00.000Z', '2020-12-31T00:00:00.000Z'],
        },
    },
    {
        name: 'with DISTINCT values',
        query: tracks
            .select(
                alias(t.composer.distinct(), 'unique_composers'),
                alias(count(t.unitPrice.distinct()), 'price_variations'),
            ),
        expected: {
            sql: `
                SELECT
                    DISTINCT tracks.composer AS unique_composers,
                    COUNT(DISTINCT tracks.unitPrice) AS price_variations
                FROM
                    tracks
            `,
        },
    }
])
