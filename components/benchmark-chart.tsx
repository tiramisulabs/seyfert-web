"use client"

// Canvas renderer adapted from Boring Software Inc.'s Tripwire project (MIT):
// https://github.com/Boring-Software-Inc/tripwire
import { useEffect, useMemo, useRef, useState } from "react"

type ChartColor = "green" | "blue" | "purple" | "pink" | "orange" | "red" | "grey"
type ChartRow = Record<string, unknown> & { time: number; timeLabel: string }
type ChartConfig = Record<string, { label?: string; color: ChartColor }>

const PALETTE: Record<ChartColor, [number, number, number]> = {
  green: [40, 210, 110],
  blue: [53, 143, 243],
  purple: [150, 110, 255],
  pink: [240, 90, 190],
  orange: [255, 150, 50],
  red: [240, 70, 70],
  grey: [92, 92, 100],
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((value) => (value + 0.5) / 16))

const MARKER_COLOR: [number, number, number] = [255, 232, 164]

const rgb = ([r, g, b]: [number, number, number], alpha = 1) =>
  `rgba(${r},${g},${b},${alpha})`

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? `${hours}h ${rest}m` : `${rest}m`
}

export function BenchmarkChart({
  data,
  config,
}: {
  data: ChartRow[]
  config: ChartConfig
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasAnimatedRef = useRef(false)
  const entranceStartedRef = useRef<number | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [starTick, setStarTick] = useState(0)
  const keys = useMemo(() => Object.keys(config), [config])

  const max = useMemo(() => {
    let value = 1
    for (const row of data) {
      for (const key of keys) {
        const point = row[key]
        if (typeof point === "number") value = Math.max(value, point)
      }
    }
    return Math.ceil(value / 50) * 50
  }, [data, keys])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (hoverIndex == null) return
    const timer = window.setInterval(() => setStarTick((tick) => tick + 1), 100)
    return () => window.clearInterval(timer)
  }, [hoverIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.width || !size.height || data.length < 2) return

    const columns = Math.min(520, Math.max(8, Math.round(size.width / 2)))
    const rows = Math.min(200, Math.max(8, Math.round(size.height / 2)))
    canvas.width = columns
    canvas.height = rows
    const context = canvas.getContext("2d")
    if (!context) return

    const topPadding = 8
    const bottomPadding = 14
    const plotHeight = rows - topPadding - bottomPadding
    const started = entranceStartedRef.current ?? performance.now()
    entranceStartedRef.current ??= started
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const animateEntrance = !hasAnimatedRef.current && !reduced
    let frame = 0

    const pointAt = (key: string, x: number) => {
      const position = (x / Math.max(columns - 1, 1)) * (data.length - 1)
      const left = Math.floor(position)
      const mix = position - left
      const a = Number(data[left]?.[key] ?? 0)
      const b = Number(data[Math.min(left + 1, data.length - 1)]?.[key] ?? a)
      return a + (b - a) * mix
    }

    const draw = (now: number) => {
      context.clearRect(0, 0, columns, rows)
      const progress = animateEntrance ? Math.min(1, (now - started) / 650) : 1
      const eased = progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2
      const reveal = Math.ceil(eased * columns)

      keys.forEach((key, layer) => {
        const color = PALETTE[config[key]?.color ?? "grey"]
        const dim = focusKey && focusKey !== key ? 0.24 : 1
        const sparse = layer * 0.14

        for (let x = 0; x < reveal; x += 1) {
          const value = pointAt(key, x)
          const top = Math.round(topPadding + (1 - value / max) * plotHeight)
          const floor = Math.min(rows - bottomPadding, top + Math.max(6, Math.round(rows * 0.11)))
          const depth = Math.max(1, floor - top)

          for (let y = top; y < floor; y += 1) {
            const density = 1 - (y - top) / depth
            const lit = density > BAYER[y & 3][x & 3] + sparse
            const alpha = (lit ? 0.3 + density * 0.7 : (0.3 + density * 0.7) * 0.4) * dim
            context.fillStyle = rgb(color, alpha)
            context.fillRect(x, y, 1, 1)
          }

          context.fillStyle = rgb(color, 0.72 * dim)
          context.fillRect(x, top, 1, 1)
        }

        const stars = Math.max(4, Math.round(columns / 14))
        for (let index = 0; index < stars; index += 1) {
          const seed = index * 67 + 13 + layer * 131
          const x = Math.round(((seed % data.length) / (data.length - 1)) * (columns - 1))
          if (x >= reveal) continue
          const value = pointAt(key, x)
          const top = Math.round(topPadding + (1 - value / max) * plotHeight)
          const depth = ((seed * 53 + 7) % 100) / 100
          const y = Math.round(top + depth * Math.max(6, rows * 0.11))
          const wink = (Math.sin((starTick + seed) * 0.35) + 1) / 2
          if (wink < 0.55) continue
          context.fillStyle = rgb(color, wink * 0.85 * dim)
          context.fillRect(x, y, 1, 1)
          if (wink > 0.9) {
            context.fillRect(x - 1, y, 1, 1)
            context.fillRect(x + 1, y, 1, 1)
            context.fillRect(x, y - 1, 1, 1)
            context.fillRect(x, y + 1, 1, 1)
          }
        }

        if (hoverIndex != null) {
          const x = Math.round((hoverIndex / (data.length - 1)) * (columns - 1))
          const value = Number(data[hoverIndex]?.[key] ?? 0)
          const y = Math.round(topPadding + (1 - value / max) * plotHeight)
          context.fillStyle = rgb(MARKER_COLOR, dim)
          context.beginPath()
          context.arc(x, y, 1.5, 0, Math.PI * 2)
          context.fill()
        }
      })

      if (progress < 1) frame = requestAnimationFrame(draw)
      else hasAnimatedRef.current = true
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [config, data, focusKey, hoverIndex, keys, max, size, starTick])

  const xTicks = data.filter((_, index) => index % 3 === 0)
  const yTicks = Array.from({ length: max / 50 + 1 }, (_, index) => index * 50)
  const hoverTop = hoverIndex == null
    ? 0
    : Math.max(
        112,
        8 +
          (1 - Math.max(...keys.map((key) => Number(data[hoverIndex]?.[key] ?? 0))) / max) *
            Math.max(0, size.height - 22)
      )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={hostRef}
        className="relative min-h-0 flex-1"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
          setHoverIndex(Math.round(ratio * (data.length - 1)))
        }}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <div className="pointer-events-none absolute inset-x-0 top-2 bottom-7 flex flex-col justify-between">
          {[...yTicks].reverse().map((tick) => (
            <div key={tick} className="relative border-t border-white/[0.07]">
              <span className="absolute -top-2.5 left-0 font-mono text-[9px] text-[var(--text-dim)]">
                {tick} MB
              </span>
            </div>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Chart"
          className="pointer-events-none absolute inset-0 size-full"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between pl-1 font-mono text-[9px] text-[var(--text-dim)]">
          {xTicks.map((row) => <span key={row.time}>{formatTime(row.time)}</span>)}
        </div>
        {hoverIndex != null && data[hoverIndex] && (
          <div
            className="pointer-events-none absolute z-10 min-w-40 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[var(--surface)]/80 p-3 font-mono text-[10px] shadow-xl backdrop-blur-sm"
            style={{
              left: `${Math.min(82, Math.max(18, (hoverIndex / (data.length - 1)) * 100))}%`,
              top: hoverTop - 28,
            }}
          >
            <div className="mb-2 text-[var(--text-bright)]">{data[hoverIndex].timeLabel}</div>
            {keys.map((key) => (
              <div key={key} className="flex items-center gap-2 py-0.5">
                <span className="size-2 rounded-sm" style={{ backgroundColor: rgb(PALETTE[config[key].color]) }} />
                <span className="text-[var(--text-dim)]">{config[key].label ?? key}</span>
                <span className="ml-auto pl-3 text-[var(--text-bright)]">
                  {Number(data[hoverIndex][key]).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-dim)] transition-opacity"
            onPointerEnter={() => setFocusKey(key)}
            onPointerLeave={() => setFocusKey(null)}
          >
            <span className="size-2 rounded-sm" style={{ backgroundColor: rgb(PALETTE[config[key].color]) }} />
            {config[key].label ?? key}
          </button>
        ))}
      </div>
    </div>
  )
}
