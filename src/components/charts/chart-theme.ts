// Chart palette (validated with the dataviz palette validator against the white
// card surface: all checks pass, worst CVD ΔE 21.6). Text never uses these colors.
export const CHART = {
    above: "#2a78d6", // blue: above baseline / regular videos
    below: "#e34948", // red: below baseline
    highlight: "#eb6834", // orange: revival candidates
    reference: "#52514e", // secondary ink: expected curve / baseline
    grid: "#e1e0d9",
    axis: "#898781",
    surface: "#ffffff",
} as const

export function compactNumber(value: number): string {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}
