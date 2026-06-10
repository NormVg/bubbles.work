import { ref } from 'vue'
import { useSettingsStore } from '~/stores/settings.store'

export function useSpeechToText() {
  const isRecording = ref(false)
  const transcript = ref('')
  const error = ref<string | null>(null)
  const volume = ref(0)
  
  const settingsStore = useSettingsStore()
  
  let nativeRecognition: any = null
  let sarvamRecorder: MediaRecorder | null = null
  let mediaStream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let animationFrameId: number | null = null
  let chunkTimer: any = null
  let transcriptChunks: string[] = []

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
      if (chunkTimer) {
        clearTimeout(chunkTimer)
        chunkTimer = null
      }
      if (sarvamRecorder && sarvamRecorder.state !== 'inactive') {
        sarvamRecorder.stop()
      }
      sarvamRecorder = null
    } catch (e) {
      console.warn('Error stopping sarvam recorder', e)
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    if (analyser) {
      analyser.disconnect()
      analyser = null
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

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('[Sarvam] Microphone access granted for REST chunking')
    setupVolumeMeter(mediaStream)
    
    transcriptChunks = []
    startSarvamChunk()
  }

  function startSarvamChunk() {
    if (!isRecording.value || !mediaStream) return

    const recorder = new MediaRecorder(mediaStream)
    const audioChunks: BlobPart[] = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.push(e.data)
      }
    }

    recorder.onstop = () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: recorder.mimeType || 'audio/webm' })
        uploadChunkToSarvam(audioBlob)
      }
    }

    try {
      recorder.start()
      sarvamRecorder = recorder
      
      // Stop and cycle every 25 seconds to stay under Sarvam's 30s limit
      chunkTimer = setTimeout(() => {
        if (isRecording.value && recorder.state !== 'inactive') {
          recorder.stop()
          startSarvamChunk()
        }
      }, 25000)
    } catch (e: any) {
      console.error('[Sarvam] Failed to start MediaRecorder:', e)
      error.value = 'Failed to start recording chunk: ' + e.message
      stopRecording()
    }
  }

  async function uploadChunkToSarvam(blob: Blob) {
    if (!settingsStore.sarvamApiKey) return

    const formData = new FormData()
    formData.append('file', blob, 'audio_chunk.webm')
    formData.append('model', 'saaras:v3')
    formData.append('mode', 'transcribe')
    formData.append('language_code', 'en-IN')

    try {
      console.log('[Sarvam] Uploading chunk:', blob.size, 'bytes')
      const res = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': settingsStore.sarvamApiKey
        },
        body: formData
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[Sarvam] REST Error:', errText)
        if (isRecording.value) {
          error.value = `Sarvam API Error: ${res.status} ${res.statusText}`
          stopRecording()
        }
        return
      }

      const data = await res.json()
      console.log('[Sarvam] Chunk transcript:', data)

      if (data.transcript) {
        transcriptChunks.push(data.transcript)
        transcript.value = transcriptChunks.join(' ')
      }
    } catch (e: any) {
      console.error('[Sarvam] Network error uploading chunk:', e)
      if (isRecording.value) {
        error.value = 'Failed to connect to Sarvam API: ' + e.message
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
