const QUEUE_KEY = 'inlineSyncQueue'

export interface QueuedPayload {
  pageUrl: string
  featureKey: string
  data: unknown
  timestamp: number
}

export async function enqueue(payload: QueuedPayload): Promise<void> {
  const queue = await getQueue()
  queue.push(payload)
  await chrome.storage.local.set({ [QUEUE_KEY]: queue })
}

export async function getQueue(): Promise<QueuedPayload[]> {
  return new Promise(resolve => {
    chrome.storage.local.get(QUEUE_KEY, r => {
      resolve(Array.isArray(r[QUEUE_KEY]) ? r[QUEUE_KEY] : [])
    })
  })
}

export async function clearQueue(): Promise<void> {
  await chrome.storage.local.remove(QUEUE_KEY)
}

export async function dequeue(): Promise<QueuedPayload | undefined> {
  const queue = await getQueue()
  const item = queue.shift()
  await chrome.storage.local.set({ [QUEUE_KEY]: queue })
  return item
}
