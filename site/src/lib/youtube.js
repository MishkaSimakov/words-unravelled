export const youtubeUrl = (id, t) => `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}s` : ''}`
export const thumbUrl = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
export const embedUrl = (id, start) => {
  const params = new URLSearchParams({ start: String(start), autoplay: '1', rel: '0', modestbranding: '1' })
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

// Seconds of lead-in before a mention's timestamp, so playback starts just before the term comes up.
export const LEAD_IN = 3

let youtubeApi = null

/** The YouTube IFrame Player API, loaded on first use. */
export function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  youtubeApi ??= new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => {
      youtubeApi = null
      script.remove()
      reject(new Error('Could not load the YouTube player API'))
    }
    document.head.append(script)
  })
  return youtubeApi
}
