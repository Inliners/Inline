'use client'

import {
  renderHeroToolIcon,
  type HeroToolIconId,
} from '@/components/marketing/extensionToolIcons'
import InlineBrandGlyph from '@/components/marketing/InlineBrandGlyph'
import {
  mktHeroAmbient,
  mktLogoTileShadow,
  mktTileShadow,
} from '@/components/marketing/marketingSurfaces'

type TileDef = { tool?: HeroToolIconId; center?: boolean }

/**
 * Loose row layout — wide gaps, vignette mask, extension tool icons.
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

const GLYPH_SIZE = 30

const TILE_SIZE =
  'h-[clamp(52px,7.5vw,72px)] w-[clamp(52px,7.5vw,72px)]'

const TILE_CLASS = `flex shrink-0 items-center justify-center rounded-[18px] bg-white text-[#78716c] border border-[#d6d3d1] ${mktTileShadow} ${TILE_SIZE}`

function ToolTile({ tool }: { tool: HeroToolIconId }) {
  return (
    <div className={TILE_CLASS}>
      <span className="flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8 [&>svg]:h-full [&>svg]:w-full">
        {renderHeroToolIcon(tool, GLYPH_SIZE)}
      </span>
    </div>
  )
}

export default function HeroCaptureGrid() {
  return (
    <div
      className="relative mx-auto mb-6 flex w-full max-w-[min(100%,52rem)] shrink-0 items-center justify-center px-2"
      style={{ height: 'clamp(260px, 36vh, 340px)' }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(380px,98%)] w-[min(660px,102%)] -translate-x-1/2 -translate-y-1/2 blur-[40px]"
        style={{ background: mktHeroAmbient }}
      />

      <div className="relative h-full w-full mask-[radial-gradient(52%_68%_at_50%_50%,black_28%,transparent_94%)]">
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 sm:gap-4">
          {ROWS.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center justify-center gap-3 sm:gap-4"
            >
              {row.map((tile, colIndex) =>
                tile.center ? (
                  <div
                    key="logo"
                    className={`${TILE_SIZE} shrink-0 overflow-hidden rounded-[18px] ${mktLogoTileShadow}`}
                  >
                    <InlineBrandGlyph />
                  </div>
                ) : tile.tool ? (
                  <ToolTile key={`${rowIndex}-${colIndex}-${tile.tool}`} tool={tile.tool} />
                ) : null,
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
