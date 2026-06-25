import { useEffect, useState, type ReactNode, type CSSProperties, type MouseEvent } from 'react'
import { InlineChatBadge } from './InlineChatIcon'
import { ToolHeaderIcon, type ToolId } from './toolIcons'
import { PANEL as C, CHAT, FONT, BRAND_GRADIENT, PANEL_HEADER_ICON, DOCK_CLEARANCE, Z } from '../lib/extensionTheme'

/**
 * Inline panel design system.
 *
 * One premium, solid work-surface shell plus the primitives every tool panel
 * is built from — action tiles, chips, a segmented control, custom toggles and
 * a real composer. Warm off-white surfaces, crisp white inner cards, soft
 * layered shadows, generous spacing and confident hierarchy.
 */

/* ─────────────────────────  Brand + chrome  ───────────────────────── */

/** The Inline brand glyph (slanted tick) inside a navy rounded tile. */
export function BrandMark({ size = 24, radius }: { size?: number; radius?: number | string }) {
  return (
    <span
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, flexShrink: 0,
        borderRadius: radius ?? '50%',
        background: BRAND_GRADIENT,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{
        width: Math.max(2, Math.round(size * 0.13)), height: Math.round(size * 0.48),
        borderRadius: 2, background: '#FFFFFF', transform: 'rotate(-12deg)',
      }} />
    </span>
  )
}

const ICloseGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
)

/** Custom close button — hover state, accessible label, never a native title. */
export function CloseButton({ onClose, label = 'Close' }: { onClose: () => void; label?: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClose}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: C.radiusSm, border: 'none', padding: 0,
        background: hov ? C.hoverBg : 'transparent',
        color: hov ? C.text : C.textMuted,
        cursor: 'pointer', transition: 'background 0.14s, color 0.14s', flexShrink: 0,
      }}
    >
      <ICloseGlyph />
    </button>
  )
}

export interface PanelShellProps {
  title: string
  subtitle?: string
  chip?: string
  width?: number
  onClose: () => void
  footer?: ReactNode
  headerActions?: ReactNode
  /** Optional element rendered before the close button (e.g. a back button). */
  headerLeading?: ReactNode
  /** Use the canonical chat badge instead of the brand mark in the header. */
  useChatBrand?: boolean
  /** Tool-specific header icon (matches dock / flyout). */
  tool?: ToolId
  children: ReactNode
  style?: CSSProperties
}

/**
 * The premium work-panel shell: solid warm surface, big rounded corners, a
 * soft layered shadow, and a confident branded header with a custom close.
 */
export function PanelShell({
  title, subtitle, chip, width = 360, onClose, footer, headerActions, headerLeading, useChatBrand, tool, children, style,
}: PanelShellProps) {
  return (
    <div
      style={{
        width,
        maxWidth: 'min(94vw, 388px)',
        maxHeight: 'calc(100vh - 64px)',
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        boxShadow: C.shadowOuter,
        fontFamily: FONT,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
          padding: '0 16px 0 20px',
          background: C.headerBg,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          {headerLeading}
          {useChatBrand
            ? <InlineChatBadge />
            : tool
              ? <ToolHeaderIcon tool={tool} />
              : <BrandMark size={PANEL_HEADER_ICON.badgeSize} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 500,
              color: C.text,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{title}</div>
            {subtitle && (
              <div style={{
                marginTop: 2,
                fontSize: 12,
                color: C.textMuted,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{subtitle}</div>
            )}
          </div>
          {chip && <Pill>{chip}</Pill>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          {headerActions}
          <CloseButton onClose={onClose} />
        </div>
      </header>

      <div style={{
        display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1,
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {children}
      </div>

      {footer && (
        <div style={{ background: 'rgba(255,255,255,0.95)', flexShrink: 0 }}>
          {footer}
        </div>
      )}
    </div>
  )
}

const panelSurfaceStyle: CSSProperties = {
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: C.radius,
  boxShadow: C.shadowOuter,
  fontFamily: FONT,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

export interface FloatingPanelShellProps {
  title: string
  subtitle?: string
  width?: number
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
  position?: { right?: number; top?: number; left?: number; bottom?: number }
  zIndex?: number
  className?: string
  tool?: ToolId
  useChatBrand?: boolean
  onHeaderMouseDown?: (e: MouseEvent) => void
  headerCursor?: CSSProperties['cursor']
  /** Skip default body padding (e.g. anchor note with its own field). */
  bareBody?: boolean
}

/** Fixed-position panel shell — same chrome as dock panels (Ask, Rewrite, etc.). */
export function FloatingPanelShell({
  title, subtitle, width = 360, onClose, footer, children,
  position, zIndex, className, tool, useChatBrand, onHeaderMouseDown, headerCursor, bareBody,
}: FloatingPanelShellProps) {
  const pos = position ?? { right: DOCK_CLEARANCE, top: 16 }
  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        ...pos,
        width,
        maxWidth: 'min(94vw, 388px)',
        maxHeight: '70vh',
        zIndex: zIndex ?? Z.floatingOverlay,
        pointerEvents: 'auto',
        ...panelSurfaceStyle,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
          padding: '0 16px 0 20px',
          background: C.headerBg,
          flexShrink: 0,
        }}
      >
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1,
            cursor: headerCursor, userSelect: onHeaderMouseDown ? 'none' : undefined,
          }}
        >
          {useChatBrand
            ? <InlineChatBadge />
            : tool
              ? <ToolHeaderIcon tool={tool} />
              : <BrandMark size={PANEL_HEADER_ICON.badgeSize} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 500, color: C.text, letterSpacing: '-0.01em',
              lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</div>
            {subtitle && (
              <div style={{
                marginTop: 2, fontSize: 12, color: C.textMuted, lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{subtitle}</div>
            )}
          </div>
        </div>
        <CloseButton onClose={onClose} />
      </header>

      <div style={{
        display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1,
        overflowY: 'auto', overflowX: 'hidden',
        ...(bareBody ? {} : { padding: '16px 20px', fontSize: 14, lineHeight: 1.55, color: C.text }),
      }}>
        {children}
      </div>

      {footer && (
        <div style={{ background: C.bg, flexShrink: 0 }}>
          {footer}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────  Review / diff result UI  ───────────────────────── */

export const DIFF = {
  removedBg: '#FEE2E2',
  removedText: '#991B1B',
  addedBg: '#DCFCE7',
  addedText: '#166534',
} as const

export function DiffRemovedBlock({ children }: { children: ReactNode }) {
  return (
    <p style={{
      margin: 0, padding: '4px 8px', borderRadius: C.radiusSm,
      background: DIFF.removedBg, color: DIFF.removedText,
      textDecoration: 'line-through', fontSize: 12, lineHeight: 1.45,
    }}>{children}</p>
  )
}

export function DiffAddedBlock({ children }: { children: ReactNode }) {
  return (
    <p style={{
      margin: 0, padding: '4px 8px', borderRadius: C.radiusSm,
      background: DIFF.addedBg, color: DIFF.addedText,
      fontSize: 12, lineHeight: 1.45,
    }}>{children}</p>
  )
}

/** Side-by-side removed / added blocks — matches the Ask recap review mock. */
export function BlockDiffView({ original, updated }: { original: string; updated: string }) {
  const oldText = original.trim()
  const newText = updated.trim()
  if (!oldText) {
    return <DiffAddedBlock>{newText}</DiffAddedBlock>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <DiffRemovedBlock>{oldText}</DiffRemovedBlock>
      <DiffAddedBlock>{newText}</DiffAddedBlock>
    </div>
  )
}

export function PanelResultCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      minHeight: 48,
      maxHeight: 280,
      overflowY: 'auto',
      ...style,
    }}>
      {children}
    </div>
  )
}

const ICheckGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

export function GhostFooterButton({
  label, onClick, disabled,
}: { label: string; onClick: () => void; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '6px 12px', borderRadius: C.radiusPill, border: 'none',
        background: hov && !disabled ? C.hoverBg : 'transparent',
        color: C.textMuted, fontSize: 12, fontWeight: 500, fontFamily: FONT,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
      }}
    >{label}</button>
  )
}

export function ApproveFooterButton({
  label = 'Approve', onClick, disabled,
}: { label?: string; onClick: () => void; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '6px 12px', borderRadius: C.radiusPill, border: 'none',
        background: CHAT.send, color: '#fff',
        fontSize: 12, fontWeight: 500, fontFamily: FONT,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        filter: hov && !disabled ? 'brightness(1.05)' : undefined,
      }}
    >
      <ICheckGlyph /> {label}
    </button>
  )
}

/** Back / Reject / Approve row — matches extension recap review mock. */
export function ReviewFooter({
  onBack, onReject, onApprove,
  approveLabel = 'Approve', approveDisabled, showReject = true, showApprove = true,
}: {
  onBack: () => void
  onReject?: () => void
  onApprove?: () => void
  approveLabel?: string
  approveDisabled?: boolean
  showReject?: boolean
  showApprove?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 8, padding: '12px 16px', flexWrap: 'wrap',
    }}>
      <GhostFooterButton label="Back" onClick={onBack} />
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        {showReject && onReject && <GhostFooterButton label="Reject" onClick={onReject} />}
        {showApprove && onApprove && (
          <ApproveFooterButton label={approveLabel} onClick={onApprove} disabled={approveDisabled} />
        )}
      </div>
    </div>
  )
}

/** Footer action row for floating / dock panels. */
export function PanelFooterBar({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 18px' }}>
      {children}
    </div>
  )
}

/** A small status/context pill used in headers. */
export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' }) {
  const accent = tone === 'accent'
  return (
    <span style={{
      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: C.radiusPill,
      background: accent ? 'rgba(75,131,196,0.12)' : C.surfaceMuted,
      border: `1px solid ${accent ? 'rgba(75,131,196,0.22)' : C.divider}`,
      color: accent ? CHAT.ring : C.textMuted,
      fontSize: 10, fontWeight: 600, letterSpacing: '0.01em',
      maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

/* ─────────────────────────  Layout helpers  ───────────────────────── */

/** Quiet section label with consistent rhythm. */
export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      margin: '0 2px 8px',
      fontSize: 12,
      fontWeight: 500,
      color: C.textMuted,
      letterSpacing: 0,
      textTransform: 'none',
      lineHeight: 1.25,
      ...style,
    }}>{children}</div>
  )
}

/** Ask-panel body rhythm — shared across tool popups. */
export const panelBodyStyle: CSSProperties = {
  padding: '20px 20px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

/** Bordered inner section shell — matches Ask page card / composer / action tiles. */
export const panelSectionShellStyle: CSSProperties = {
  border: `1px solid ${C.border}`,
  borderRadius: C.radiusMd,
  background: C.surfaceBubble,
  boxShadow: 'none',
}

export function PanelSection({
  children,
  style,
  list,
}: {
  children: ReactNode
  style?: CSSProperties
  /** Stacked rows with dividers — no inner padding on the shell. */
  list?: boolean
}) {
  return (
    <div style={{
      ...panelSectionShellStyle,
      ...(list ? { overflow: 'hidden', padding: 0 } : { padding: 12 }),
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─────────────────────────  Interactive tiles/chips  ───────────────────────── */

/** A solid quick-action card with optional leading icon + description. */
export function ActionTile({
  icon, label, desc, disabled, onClick,
}: { icon?: ReactNode; label: string; desc?: string; disabled?: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
        padding: '10px 12px', borderRadius: C.radiusMd, width: '100%', boxSizing: 'border-box',
        border: `1px solid ${disabled ? C.divider : hov ? C.borderStrong : C.border}`,
        background: disabled ? C.surfaceMuted : C.surfaceBubble,
        color: disabled ? C.textLight : C.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'background 0.14s, border-color 0.14s',
        fontFamily: FONT,
      }}
    >
      {icon && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: C.radiusSm, flexShrink: 0,
          background: disabled ? C.surfaceSunken : C.surfaceMuted,
          color: disabled ? C.textLight : C.text,
        }}>{icon}</span>
      )}
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{label}</span>
        {desc && <span style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.3 }}>{desc}</span>}
      </span>
    </button>
  )
}

/** Pill-style chip with hover + active states. */
export function Chip({
  label, active, disabled, onClick,
}: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={label}
      aria-pressed={active}
      style={{
        padding: '7px 13px', borderRadius: C.radiusPill,
        border: `1px solid ${active ? C.accent : disabled ? C.divider : hov ? C.borderStrong : C.border}`,
        background: active ? C.accent : disabled ? C.surfaceMuted : hov ? C.hoverBg : C.surfaceBubble,
        color: active ? '#fff' : disabled ? C.textLight : C.text,
        fontSize: 12, fontWeight: 500, fontFamily: FONT, letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1,
        boxShadow: 'none',
        transition: 'background 0.14s, border-color 0.14s, color 0.14s',
      }}
    >{label}</button>
  )
}

/** iOS-style segmented control. */
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{
      display: 'flex', gap: 3, padding: 4, borderRadius: C.radiusMd,
      background: C.surfaceSunken, border: `1px solid ${C.divider}`,
    }}>
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: C.radiusSm, border: 'none',
              background: active ? C.surfaceBubble : 'transparent',
              color: active ? C.text : C.textMuted,
              fontSize: 12, fontWeight: active ? 600 : 500, fontFamily: FONT, letterSpacing: '-0.01em',
              cursor: 'pointer',
              transition: 'background 0.14s, color 0.14s',
            }}
          >{o.label}</button>
        )
      })}
    </div>
  )
}

/** Custom toggle switch (no native control). */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? `${checked ? 'Disable' : 'Enable'} ${label}` : undefined}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 44, height: 26, borderRadius: C.radiusPill,
        background: checked ? C.toggleOn : C.toggleOff, border: 'none', cursor: 'pointer', padding: 0,
        transition: 'background 0.22s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'block',
        boxShadow: 'none',
        transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </button>
  )
}

/** Custom checkbox (no native control). */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
        padding: '9px 11px', borderRadius: 13, border: `1px solid ${hov ? C.borderStrong : C.border}`,
        background: C.surfaceBubble, cursor: 'pointer', fontFamily: FONT,
        transition: 'border-color 0.14s, background 0.14s',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 19, height: 19, borderRadius: 7, flexShrink: 0,
        background: checked ? C.accent : C.surfaceBubble,
        border: `1.5px solid ${checked ? C.accent : C.borderStrong}`,
        color: '#fff', transition: 'background 0.14s, border-color 0.14s',
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        )}
      </span>
      <span style={{ fontSize: 13, fontWeight: 550, color: C.text }}>{label}</span>
    </button>
  )
}

const IArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

/** Chat-style composer — matches the web dashboard AI input. */
export function Composer({
  value, onChange, onSubmit, placeholder, disabled, modeLabel = 'Smart mode', sendDisabled,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  modeLabel?: string
  sendDisabled?: boolean
}) {
  const [focus, setFocus] = useState(false)
  const canSend = !sendDisabled && !disabled && value.trim().length > 0
  return (
    <div style={{
      overflow: 'hidden',
      border: `1px solid ${focus ? CHAT.ring : CHAT.inputBorder}`,
      borderRadius: C.radiusMd,
      background: disabled ? C.surfaceMuted : C.inputBg,
      boxShadow: focus ? CHAT.inputGlow : 'none',
      transition: 'border-color 0.14s, box-shadow 0.14s',
    }}>
      {value.trim() && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(28, 30, 38, 0.10)',
          background: 'rgba(28, 30, 38, 0.05)',
          padding: '8px 16px',
          fontSize: 12,
          color: C.accent,
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.trim()}</span>
        </div>
      )}
      <div style={{ display: 'flex', minHeight: 78, flexDirection: 'column', padding: '12px 16px' }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && canSend) { e.preventDefault(); onSubmit() } }}
          disabled={disabled}
          placeholder={placeholder}
          rows={2}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none',
            background: 'transparent', fontSize: 14, lineHeight: 1.5, color: C.text,
            fontFamily: FONT, padding: '0 0 8px', minHeight: 34, boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 'auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px',
            borderRadius: C.radiusSm, background: C.surfaceMuted,
            fontSize: 12, fontWeight: 500, color: C.text,
          }}>
            {modeLabel}
          </span>
          <button
            type="button"
            onClick={() => { if (canSend) onSubmit() }}
            disabled={!canSend}
            aria-label="Send"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: C.radiusPill, border: 'none',
              background: canSend ? CHAT.send : C.surfaceMuted,
              color: canSend ? '#fff' : C.textMuted,
              cursor: canSend ? 'pointer' : 'not-allowed', flexShrink: 0,
              opacity: canSend ? 1 : 0.35,
              transition: 'background 0.14s, opacity 0.14s',
            }}
          ><IArrowUp /></button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────  States  ───────────────────────── */

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${C.divider}`, borderTopColor: C.accent,
      borderRadius: '50%', animation: 'inline-spin 0.7s linear infinite',
    }} />
  )
}

export function PanelLoading({ label = 'Working…' }: { label?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '38px 20px', color: C.textMuted, fontFamily: FONT,
    }}>
      <Spinner size={24} />
      <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  )
}

export function PanelEmpty({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 9, padding: '34px 24px', textAlign: 'center', fontFamily: FONT,
    }}>
      {icon && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 46, height: 46, borderRadius: 16, marginBottom: 2,
          background: C.surfaceMuted, color: C.textMuted, border: `1px solid ${C.divider}`,
        }}>{icon}</div>
      )}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: C.textMuted, maxWidth: 240, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  )
}

export function PanelError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 11, padding: '30px 24px', textAlign: 'center', fontFamily: FONT,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 44, height: 44, borderRadius: 15,
        background: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220,38,38,0.18)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <div style={{ fontSize: 13, color: C.text, maxWidth: 250, lineHeight: 1.5 }}>{message}</div>
      {onRetry && (
        <button type="button" onClick={onRetry} style={{
          marginTop: 2, padding: '8px 18px', borderRadius: C.radiusPill,
          border: `1px solid ${C.border}`, background: C.surfaceBubble, color: C.text,
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: 'none',
        }}>Try again</button>
      )}
    </div>
  )
}

/* ─────────────────────────  Hooks + utilities  ───────────────────────── */

/** Close the panel when Escape is pressed (capture so it beats page handlers). */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onEscape() }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [active, onEscape])
}

/** Inject the spin keyframes once into the shadow root that hosts the panels. */
let keyframesInjected = false
export function ensurePanelKeyframes(root: ShadowRoot | Document | null) {
  if (keyframesInjected || !root) return
  try {
    const style = document.createElement('style')
    style.textContent = '@keyframes inline-spin{to{transform:rotate(360deg)}}'
    ;(root as ShadowRoot).appendChild(style)
    keyframesInjected = true
  } catch { /* ignore */ }
}
