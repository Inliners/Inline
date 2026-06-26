/** Slanted tick from the extension launcher — the Inline brand mark. */

export const INLINE_BRAND_GRADIENT =
  'linear-gradient(145deg, #24386D 0%, #0B1735 58%, #071021 100%)'

const TICK_CLASS =
  'block h-[46%] w-[8%] min-w-[5px] max-w-[8px] -rotate-12 rounded-[3px] bg-white'

type InlineBrandGlyphProps = {
  /** Full navy tile fill. When false, only the white tick — for launcher buttons or hero keycap overlay. */
  tile?: boolean
}

export default function InlineBrandGlyph({ tile = true }: InlineBrandGlyphProps) {
  const tick = <span className={TICK_CLASS} aria-hidden />

  if (!tile) {
    return tick
  }

  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-[13px] border border-white/10"
      style={{ background: INLINE_BRAND_GRADIENT }}
      aria-hidden
    >
      {tick}
    </span>
  )
}
