export interface LayerVisibility {
  highlights: boolean
  drawings: boolean
  stickies: boolean
  stamps: boolean
}

const KEY = 'inlineLayerVisibility'
const DEFAULTS: LayerVisibility = { highlights: true, drawings: true, stickies: true, stamps: true }

export async function loadLayers(): Promise<LayerVisibility> {
  return new Promise(resolve => {
    chrome.storage.local.get(KEY, r => {
      resolve(r[KEY] ? { ...DEFAULTS, ...r[KEY] } : DEFAULTS)
    })
  })
}

export async function saveLayers(layers: LayerVisibility): Promise<void> {
  await chrome.storage.local.set({ [KEY]: layers })
}
