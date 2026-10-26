import { isIP } from 'net'

/** True for loopback, private, link-local, CGNAT and other non-public ranges. */
export function isPrivateAddress(address: string): boolean {
    if (isIP(address) === 6) {
        const lower = address.toLowerCase()
        if (lower === '::1' || lower === '::') return true
        if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) return true
        const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
        return mapped ? isPrivateAddress(mapped[1]) : false
    }

    if (isIP(address) !== 4) return true // unparseable: refuse rather than guess

    const [a, b] = address.split('.').map(Number)
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
    )
}
