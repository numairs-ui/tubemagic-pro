import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPrivateAddress } from '../src/lib/net-guard.ts'

test('blocks loopback, private, link-local and metadata addresses', () => {
    for (const ip of [
        '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1',
        '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
        '::1', '::', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', 'garbage',
    ]) {
        assert.equal(isPrivateAddress(ip), true, ip)
    }
})

test('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '142.250.72.14', '172.32.0.1', '100.128.0.1', '2607:f8b0:4005:80c::200e']) {
        assert.equal(isPrivateAddress(ip), false, ip)
    }
})
