'use client'

import {
  renderHeroToolIcon,
  type HeroToolIconId,
} from '@/components/marketing/extensionToolIcons'
import InlineBrandGlyph, { INLINE_BRAND_GRADIENT } from '@/components/marketing/InlineBrandGlyph'
import {
  mktHeroTileBackdrop,
  mktHeroTileBorder,
  mktHeroTileGlass,
  mktTileShadow,
  mktTileShadowEmphasis,
} from '@/components/marketing/marketingSurfaces'

type TileDef = { tool?: HeroToolIconId; center?: boolean }

/**
 * Staggered keyboard-style rows with glass keycap tiles and center brand mark.
 * Row counts: 5 · 6 · 5 (logo center) · 3
 */
const ROWS: TileDef[][] = [
  [
    { tool: 'ai' },
    { tool: 'rewrite' },
    { tool: 'highlighter' },
    { tool: 'notes' },
    { tool: 'draw' },
  ],
  [
    { tool: 'handwriting' },
    { tool: 'stamps' },
    { tool: 'search' },
    { tool: 'screenshot' },
    { tool: 'laser' },
    { tool: 'layers' },
  ],
  [
    { tool: 'share' },
    { tool: 'settings' },
    { center: true },
    { tool: 'notebook' },
    { tool: 'more' },
  ],
  [
    { tool: 'eyeOff' },
    { tool: 'collapse' },
    { tool: 'pause' },
  ],
]

const ROW_OFFSETS = [0, 84, 168, 252]
const TILE_PX = 80
const GLYPH_SIZE = 32

const glassTileStyle = {
  width: TILE_PX,
  height: TILE_PX,
  borderRadius: 18,
  background: mktHeroTileGlass,
  border: mktHeroTileBorder,
  backdropFilter: mktHeroTileBackdrop,
  WebkitBackdropFilter: mktHeroTileBackdrop,
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 0 rgba(255, 255, 255, 0.12)',
} as const

function BrandTile() {
  const keycapInset =
    'inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(0, 0, 0, 0.22)'

  return (
    <div
      className="relative isolate flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: TILE_PX,
        height: TILE_PX,
        borderRadius: 18,
        background: INLINE_BRAND_GRADIENT,
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: `${keycapInset}, ${mktTileShadowEmphasis}`,
      }}
    >
      <InlineBrandGlyph tile={false} />
    </div>
  )
}

function ToolTile({
  tool,
  emphasized,
}: {
  tool: HeroToolIconId
  emphasized?: boolean
}) {
  return (
    <div
      className="relative isolate flex shrink-0 items-center justify-center overflow-hidden text-[#2F2F30]"
      style={{
        ...glassTileStyle,
        boxShadow: `${glassTileStyle.boxShadow}, ${emphasized ? mktTileShadowEmphasis : mktTileShadow}`,
      }}
    >
      <span className="flex h-8 w-8 items-center justify-center [&>svg]:h-full [&>svg]:w-full">
        {renderHeroToolIcon(tool, GLYPH_SIZE)}
      </span>
    </div>
  )
}

export default function HeroCaptureGrid() {
  return (
    <div
      className="relative mx-auto mb-6 flex w-full max-w-[52rem] shrink-0 items-center justify-center px-2"
      style={{ height: 'clamp(300px, 88vw, 380px)' }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[640px] max-w-[95%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 72% 28%, rgba(252, 163, 17, 0.2) 0%, transparent 70%), radial-gradient(ellipse 50% 45% at 22% 68%, rgba(18, 69, 89, 0.18) 0%, transparent 72%)',
          filter: 'blur(32px)',
        }}
      />

      <div
        className="relative mx-auto h-[332px] w-[820px] max-w-full origin-center scale-[0.72] min-[420px]:scale-[0.78] sm:scale-[0.82] md:scale-[0.84] lg:scale-100"
        style={{
          maskImage:
            'radial-gradient(50% 60% at 50% 55%, black 25%, transparent 90%)',
          WebkitMaskImage:
            'radial-gradient(50% 60% at 50% 55%, black 25%, transparent 90%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
          style={{
            background:
              'radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.28) 0%, transparent 62%)',
          }}
        />

        {ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="absolute left-1/2 z-10 flex -translate-x-1/2 gap-2 pb-1"
            style={{ top: ROW_OFFSETS[rowIndex] }}
          >
            {row.map((tile, colIndex) =>
              tile.center ? (
                <BrandTile key="logo" />
              ) : tile.tool ? (
                <ToolTile
                  key={`${rowIndex}-${colIndex}-${tile.tool}`}
                  tool={tile.tool}
                  emphasized={rowIndex === 2}
                />
              ) : null,
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
