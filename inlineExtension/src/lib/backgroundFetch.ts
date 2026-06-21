/**
 * Proxies a fetch through the extension's background service worker.
 *
 * Content scripts on public HTTPS pages (e.g. en.wikipedia.org) cannot call
 * http://localhost:3000 directly — Chrome's Private Network Access policy
 * rejects the preflight with a CORS error. Background service workers are
 * exempt, so every backend call from content must go through this helper.
 *
 * Matches a subset of the Fetch API for JSON endpoints: you get back a small
 * response object with `ok`, `status`, `json()`, and `text()`. Binary/blob
 * responses are not supported; use a dedicated message type (e.g. INLINE_TTS)
 * for those.
 */

export type BackgroundProxyInit = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string
}

export type BackgroundProxyResponse = {
  ok: boolean
  status: number
  bodyText: string
  json: <T = unknown>() => Promise<T>
  text: () => Promise<string>
}

export async function fetchViaBackground(
  url: string,
  init: BackgroundProxyInit = {},
): Promise<BackgroundProxyResponse> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    throw new Error('Background service worker unavailable')
  }

  const response = await new Promise<{
    ok: boolean
    status: number
    bodyText: string
    error?: string
  }>((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'INLINE_PROXY_FETCH',
        payload: {
          url,
          method: init.method ?? 'GET',
          headers: init.headers ?? {},
          body: init.body,
        },
      },
      (res: { ok: boolean; status: number; bodyText: string; error?: string } | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!res) {
          reject(new Error('No response from background'))
          return
        }
        resolve(res)
      },
    )
  })

  if (response.error && !response.ok) {
    throw new Error(response.error)
  }

  return {
    ok: response.ok,
    status: response.status,
    bodyText: response.bodyText,
    json: async <T>() => JSON.parse(response.bodyText) as T,
    text: async () => response.bodyText,
  }
}
