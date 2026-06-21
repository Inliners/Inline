const READER_STYLE_ID = 'inline-reader-style'

export function enableReaderMode(): void {
  if (document.getElementById(READER_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = READER_STYLE_ID
  style.textContent = `
    body > *:not(#inline-extension-root):not(main):not(article):not([role="main"]) {
      display: none !important;
    }
    main, article, [role="main"] {
      display: block !important;
      max-width: 700px !important;
      margin: 40px auto !important;
      padding: 20px 32px !important;
      font-size: 18px !important;
      line-height: 1.8 !important;
      color: #1C1E26 !important;
      background: #FFFBF8 !important;
    }
    main *, article *, [role="main"] * {
      max-width: 100% !important;
    }
    body {
      background: #F5EBE3 !important;
    }
  `
  document.head.appendChild(style)
}

export function disableReaderMode(): void {
  document.getElementById(READER_STYLE_ID)?.remove()
}

export function isReaderMode(): boolean {
  return !!document.getElementById(READER_STYLE_ID)
}
