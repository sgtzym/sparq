import { sqlTypes } from '~/api/column.ts'
import { sparq } from '~/api/sparq.ts'
import { test } from '~~/test-runner.ts'
import { tracks } from '~~/test-data.ts'

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
                    tracks.genreId = :p1 AND
                    tracks.mediaTypeId = :p1 AND
                    tracks.unitPrice = :p2 AND
                    tracks.unitPrice != :p1 AND
                    tracks.genreId != :p3 AND
                    tracks.mediaTypeId IN (:p1, :p3, :p4)
            `,
            params: [1, 0.99, 2, 3],
        },
    },
    {
        name: 'with identifier quoting for reserved words',
        query: (() => {
            const problematic = sparq('order', {
                'select': sqlTypes.number(),
                'from': sqlTypes.text(),
                'where': sqlTypes.text(),
                'normal_column': sqlTypes.text(),
                'column-with-dash': sqlTypes.text(),
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
                    "order"."select",
                    "order"."from",
                    "order"."where",
                    "order".normal_column,
                    "order"."column-with-dash"
                FROM
                    "order"
            `,
        },
    },
    {
        name: 'with special characters in identifiers',
        query: (() => {
            const special = sparq('user-tracks', {
                'track id': sqlTypes.number(),
                'track-name': sqlTypes.text(),
                'track:name': sqlTypes.text(),
                '123_column': sqlTypes.number(),
                'SELECT': sqlTypes.text(),
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
                    "user-tracks"."track id",
                    "user-tracks"."track-name",
                    "user-tracks"."track:name",
                    "user-tracks"."123_column",
                    "user-tracks"."SELECT"
                FROM
                    "user-tracks"
                WHERE
                    "user-tracks"."track id" = :p1
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
                    tracks.composer,
                    tracks.albumId
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
                userId: sqlTypes.number(),
                notifications: sqlTypes.boolean(),
                darkMode: sqlTypes.boolean(),
            })
            return settings
                .insert('userId', 'notifications', 'darkMode')
                .values(1, true, false)
                .values(2, false, true)
        })(),
        expected: {
            sql: `
                INSERT INTO user_settings (
                    user_settings.userId,
                    user_settings.notifications,
                    user_settings.darkMode
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
                id: sqlTypes.number(),
                timestamp: sqlTypes.date(),
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
                    logs.timestamp > :p1 AND
                    logs.timestamp < :p1 AND
                    logs.timestamp != :p2
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
                    tracks.genreId IN (:p1, :p2, :p3, :p1, :p2)
            `,
            params: [1, 2, 3],
        },
    },
    {
        name: 'with schema prefix',
        query: (() => {
            const qualified = sparq('music.albums', {
                albumId: sqlTypes.number(),
                title: sqlTypes.text(),
            })
            const { $ } = qualified
            return qualified
                .select($.albumId, $.title)
                .where($.albumId.eq(1))
        })(),
        expected: {
            sql: `
                SELECT
                    music.albums.albumId,
                    music.albums.title
                FROM
                    music.albums
                WHERE
                    music.albums.albumId = :p1
            `,
            params: [1],
        },
    },
])
