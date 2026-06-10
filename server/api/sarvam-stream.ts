import { defineWebSocketHandler } from 'h3'
import WS from 'ws'

export default defineWebSocketHandler({
  open(peer) {
    // Extract API key from the WebSocket upgrade URL query params
    let apiKey: string | null = null
    
    if (peer.url) {
      try {
        const url = new URL(peer.url, 'http://localhost')
        apiKey = url.searchParams.get('key')
      } catch {
        console.error('[Sarvam Proxy] Failed to parse peer URL:', peer.url)
      }
    }

    if (!apiKey) {
      console.error('[Sarvam Proxy] Missing API key in WebSocket connection')
      peer.send(JSON.stringify({ type: 'error', data: { error: 'Missing API Key', code: 'NO_KEY' } }))
      peer.close(1008, 'Missing API Key')
      return
    }

    const sarvamParams = new URLSearchParams({
      'model': 'saaras:v3',
      'mode': 'transcribe',
      'language-code': 'en-IN',
      'sample_rate': '16000',
      'input_audio_codec': 'pcm_s16le'
    })
    const sarvamUrl = `wss://api.sarvam.ai/speech-to-text/ws?${sarvamParams.toString()}`

    console.log('[Sarvam Proxy] Connecting to Sarvam...')

    const upstream = new WS(sarvamUrl, {
      headers: {
        'Api-Subscription-Key': apiKey
      }
    })

    upstream.on('open', () => {
      console.log('[Sarvam Proxy] Connected to Sarvam API')
    })

    upstream.on('message', (data: WS.Data) => {
      const msg = data.toString()
      console.log('[Sarvam Proxy] Sarvam →', msg.substring(0, 200))
      peer.send(msg)
    })

    upstream.on('close', (code: number, reason: Buffer) => {
      console.log('[Sarvam Proxy] Sarvam closed:', code, reason.toString())
      peer.close(code, reason.toString())
    })

    upstream.on('error', (err: Error) => {
      console.error('[Sarvam Proxy] Sarvam error:', err.message)
      peer.send(JSON.stringify({ type: 'error', data: { error: err.message, code: 'UPSTREAM_ERROR' } }))
    })

    // Store upstream connection on peer
    // @ts-expect-error — attaching custom property to peer
    peer._sarvam = upstream
  },

  message(peer, message) {
    // @ts-expect-error — reading custom property from peer
    const upstream = peer._sarvam as WS | undefined
    if (upstream && upstream.readyState === WS.OPEN) {
      const text = message.text()
      upstream.send(text)
    }
  },

  close(peer) {
    // @ts-expect-error — reading custom property from peer
    const upstream = peer._sarvam as WS | undefined
    if (upstream) {
      if (upstream.readyState === WS.OPEN || upstream.readyState === WS.CONNECTING) {
        upstream.close()
      }
      // @ts-expect-error — cleanup
      peer._sarvam = undefined
    }
    console.log('[Sarvam Proxy] Client disconnected')
  }
})
