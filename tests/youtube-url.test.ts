import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
    extractChannelIdOrHandle,
    extractVideoId,
    parseISO8601Duration,
    uploadsPlaylistId,
} from '../src/lib/youtube-url.ts'

test('extractVideoId supports every common link format', () => {
    const id = 'dQw4w9WgXcQ'
    for (const input of [
        id,
        `https://www.youtube.com/watch?v=${id}`,
        `https://youtube.com/watch?v=${id}&t=42s`,
        `https://m.youtube.com/watch?v=${id}`,
        `https://youtu.be/${id}?si=abc`,
        `https://www.youtube.com/shorts/${id}`,
        `https://www.youtube.com/embed/${id}`,
        `https://www.youtube.com/live/${id}`,
        `youtube.com/watch?v=${id}`,
    ]) {
        assert.equal(extractVideoId(input), id, input)
    }
})

test('extractVideoId rejects non-video input', () => {
    assert.equal(extractVideoId('https://example.com/watch?v=dQw4w9WgXcQ'), null)
    assert.equal(extractVideoId('https://youtube.com/@handle'), null)
    assert.equal(extractVideoId('not a url'), null)
    assert.equal(extractVideoId('https://youtube.com/watch?v=short'), null)
})

test('extractChannelIdOrHandle', () => {
    assert.equal(extractChannelIdOrHandle('https://youtube.com/@NumairShahzada'), '@NumairShahzada')
    assert.equal(extractChannelIdOrHandle('https://www.youtube.com/@Fireship/videos'), '@Fireship')
    assert.equal(extractChannelIdOrHandle('youtube.com/channel/UC123abc'), 'UC123abc')
    assert.equal(extractChannelIdOrHandle('  @handle  '), '@handle')
    assert.equal(extractChannelIdOrHandle('UCabc'), 'UCabc')
})

test('parseISO8601Duration', () => {
    assert.equal(parseISO8601Duration('PT1M30S'), 90)
    assert.equal(parseISO8601Duration('PT2H'), 7200)
    assert.equal(parseISO8601Duration('PT45S'), 45)
    assert.equal(parseISO8601Duration('P1DT1H'), 90000)
    assert.equal(parseISO8601Duration(''), 0)
})

test('uploadsPlaylistId swaps UC for UU', () => {
    assert.equal(uploadsPlaylistId('UCabc123'), 'UUabc123')
})
