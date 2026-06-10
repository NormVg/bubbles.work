import { ref } from 'vue'
import { useSettingsStore } from '~/stores/settings.store'

export function useSpeechToText() {
  const isRecording = ref(false)
  const transcript = ref('')
  const error = ref<string | null>(null)
  const volume = ref(0)
  
  const settingsStore = useSettingsStore()
  
  let nativeRecognition: any = null
  let sarvamSocket: WebSocket | null = null
  let mediaStream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let scriptProcessor: ScriptProcessorNode | null = null
  let analyser: AnalyserNode | null = null
  let animationFrameId: number | null = null

  function setupVolumeMeter(stream: MediaStream) {
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 16000 })
    }
    const source = audioContext.createMediaStreamSource(stream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    function updateVolume() {
      if (!isRecording.value || !analyser) return
      analyser.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      volume.value = sum / dataArray.length
      animationFrameId = requestAnimationFrame(updateVolume)
    }
    updateVolume()
  }

  async function startRecording() {
    error.value = null
    transcript.value = ''
    isRecording.value = true
    
    if (settingsStore.sttEngine === 'sarvam' && settingsStore.sarvamApiKey) {
      try {
        await startSarvamRecording()
      } catch (err: any) {
        error.value = err.message || 'Failed to start Sarvam streaming'
        isRecording.value = false
      }
    } else {
      startNativeRecording()
    }
  }

  function stopRecording() {
    try {
      if (nativeRecognition) {
        nativeRecognition.stop()
      }
    } catch (e) {
      console.warn('Error stopping native recognition', e)
    } finally {
      nativeRecognition = null
    }
    
    try {
      if (sarvamSocket && sarvamSocket.readyState === WebSocket.OPEN) {
        sarvamSocket.send(JSON.stringify({ type: 'flush' }))
        setTimeout(() => {
          if (sarvamSocket) {
            sarvamSocket.close()
            sarvamSocket = null
          }
        }, 500)
      } else if (sarvamSocket) {
        sarvamSocket.close()
        sarvamSocket = null
      }
    } catch (e) {
      console.warn('Error closing sarvam socket', e)
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    if (analyser) {
      analyser.disconnect()
      analyser = null
    }

    if (scriptProcessor) {
      scriptProcessor.disconnect()
      scriptProcessor = null
    }

    if (audioContext) {
      audioContext.close()
      audioContext = null
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }

    isRecording.value = false
  }

  function startNativeRecording() {
    // Web Speech API Fallback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      error.value = 'Speech recognition is not supported in this browser.'
      isRecording.value = false
      return
    }

    nativeRecognition = new SpeechRecognition()
    nativeRecognition.continuous = true
    nativeRecognition.interimResults = true
    nativeRecognition.lang = 'en-IN'

    nativeRecognition.onresult = (event: any) => {
      let currentTranscript = ''
      for (let i = 0; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript
      }
      transcript.value = currentTranscript.trim()
    }

    nativeRecognition.onerror = (event: any) => {
      if (event.error === 'network') {
        error.value = "Your browser doesn't support Native dictation. Please use Sarvam, or switch to Chrome/Safari."
      } else if (event.error !== 'aborted') {
        error.value = `Native speech recognition error: ${event.error}`
      }
      stopRecording()
    }

    nativeRecognition.onend = () => {
      isRecording.value = false
    }

    try {
      nativeRecognition.start()
      // Setup volume meter for visual feedback even for native
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaStream = stream
        setupVolumeMeter(stream)
      }).catch(e => {
        console.warn('Could not get audio stream for volume meter', e)
      })
    } catch (e: any) {
      error.value = 'Failed to start native recognition: ' + e.message
      isRecording.value = false
    }
  }

  async function startSarvamRecording() {
    if (!settingsStore.sarvamApiKey) return

    // Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('[Sarvam] Microphone access granted')
    
    // Connect via Nitro proxy — browsers can't set custom WS headers,
    // and Sarvam requires Api-Subscription-Key as a header
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.host}/api/sarvam-stream?key=${encodeURIComponent(settingsStore.sarvamApiKey)}`
    console.log('[Sarvam] Connecting via proxy...')
    
    sarvamSocket = new WebSocket(wsUrl)

    sarvamSocket.onopen = () => {
      console.log('[Sarvam] Proxy connected, setting up audio pipeline')
      
      if (!audioContext) {
        audioContext = new AudioContext({ sampleRate: 16000 })
      }
      setupVolumeMeter(mediaStream!)

      const source = audioContext.createMediaStreamSource(mediaStream!)
      
      scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)
      source.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)

      let chunkCount = 0
      scriptProcessor.onaudioprocess = (e) => {
        if (!isRecording.value || !sarvamSocket || sarvamSocket.readyState !== WebSocket.OPEN) return
        
        const channelData = e.inputBuffer.getChannelData(0)
        // Convert Float32Array to Int16Array (PCM 16-bit signed little-endian)
        const int16Array = new Int16Array(channelData.length)
        for (let i = 0; i < channelData.length; i++) {
          const s = Math.max(-1, Math.min(1, channelData[i]))
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }

        // Convert to base64
        const uint8Array = new Uint8Array(int16Array.buffer)
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        const base64Audio = btoa(binary)

        // Send audio message per Sarvam API spec
        const message = {
          audio: {
            data: base64Audio,
            sample_rate: '16000',
            encoding: 'audio/wav'
          }
        }
        sarvamSocket!.send(JSON.stringify(message))
        chunkCount++
        if (chunkCount % 10 === 0) {
          console.log(`[Sarvam] Sent ${chunkCount} audio chunks`)
        }
      }
    }

    sarvamSocket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data)
        console.log('[Sarvam] Received:', response)
        
        if (response.type === 'data' && response.data?.transcript) {
          transcript.value = response.data.transcript
        } else if (response.type === 'error') {
          console.error('[Sarvam] API Error:', response.data)
          error.value = response.data?.error || 'Sarvam transcription error'
        } else if (response.type === 'events') {
          console.log('[Sarvam] Event:', response.data)
        }
      } catch (e) {
        console.error('[Sarvam] Failed to parse message:', event.data)
      }
    }

    sarvamSocket.onerror = () => {
      console.error('[Sarvam] WebSocket error')
      error.value = 'Sarvam connection failed. Check your API key.'
      stopRecording()
    }

    sarvamSocket.onclose = (event) => {
      console.log('[Sarvam] WebSocket closed:', event.code, event.reason)
      if (isRecording.value) {
        stopRecording()
      }
    }
  }

  return {
    isRecording,
    transcript,
    error,
    volume,
    startRecording,
    stopRecording
  }
}
