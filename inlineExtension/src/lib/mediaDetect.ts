export interface MediaElement {
  element: HTMLVideoElement | HTMLAudioElement
  type: 'video' | 'audio'
  currentTime: number
  duration: number
  title: string
}

export function findMediaElements(): MediaElement[] {
  const results: MediaElement[] = []

  const videos = document.querySelectorAll('video')
  videos.forEach(v => {
    if (v.duration > 0 && !isNaN(v.duration)) {
      results.push({
        element: v,
        type: 'video',
        currentTime: v.currentTime,
        duration: v.duration,
        title: document.title,
      })
    }
  })

  const audios = document.querySelectorAll('audio')
  audios.forEach(a => {
    if (a.duration > 0 && !isNaN(a.duration)) {
      results.push({
        element: a,
        type: 'audio',
        currentTime: a.currentTime,
        duration: a.duration,
        title: document.title,
      })
    }
  })

  return results
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function seekMedia(time: number): void {
  const media = findMediaElements()
  if (media.length > 0) {
    media[0].element.currentTime = time
    media[0].element.play().catch(() => {})
  }
}
