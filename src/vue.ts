import { ref, watch } from 'vue'
import { getMimeType } from './utils'
import { webmFixDuration } from './blob-fix'
import { SAMPLING_RATE } from './constants'

export function useAudioRecorder() {
  const stream = ref<MediaStream | null>(null)
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const recording = ref(false)
  const duration = ref(0)
  const recordedBlob = ref<Blob | null>(null)
  const chunks = ref<Blob[]>([])
  const initRecorder = async () => {
    if (!stream.value) {
      stream.value = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
    }
  }
  const recordedAudioBuffer = ref<AudioBuffer>()
  const startRecording = async (completeCallback?: () => void) => {
    recordedBlob.value = null
    const startTime = Date.now()
    try {
      if (!stream.value) {
        await initRecorder()
      }
      mediaRecorder.value = new MediaRecorder(stream.value!, {
        mimeType: getMimeType(),
      })
      mediaRecorder.value?.addEventListener('dataavailable', async (event) => {
        if (event.data.size > 0) {
          chunks.value.push(event.data)
        }
        if (mediaRecorder.value!.state === 'inactive') {
          const duration = Date.now() - startTime
          let blob = new Blob(chunks.value, {
            type: mediaRecorder.value!.mimeType,
          })
          if (getMimeType() === 'audio/webm') {
            blob = await webmFixDuration(blob, duration, blob.type)
          }
          recordedBlob.value = blob
          if (!recordedBlob.value?.size) {
            return
          }
          const fileReader = new FileReader()
          fileReader.onloadend = async () => {
            const audioCTX = new AudioContext({
              sampleRate: SAMPLING_RATE,
            })
            recordedAudioBuffer.value = await audioCTX.decodeAudioData(
              fileReader.result as ArrayBuffer,
            )
            completeCallback?.()
          }
          fileReader.readAsArrayBuffer(recordedBlob.value)
          chunks.value = []
        }
      })
      mediaRecorder.value!.start()
      recording.value = true
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }
  const stopRecording = () => {
    if (mediaRecorder.value?.state === 'recording') {
      mediaRecorder.value!.stop()
    }
    recording.value = false
    duration.value = 0
  }
  const handleToggleRecording = (completeCallback?: () => void) => {
    if (recording) {
      stopRecording()
    } else {
      startRecording(completeCallback)
    }
  }
  watch(recording, (val) => {
    const stream: MediaStream | null = null
    if (val) {
      const timer = setInterval(() => {
        duration.value = duration.value + 1
      }, 1000)
      return () => {
        clearInterval(timer)
      }
    }
    return () => {
      if (stream) {
        ;(stream as unknown as MediaStream)
          .getTracks()
          .forEach((track) => track.stop())
      }
    }
  })
  return {
    stream,
    mediaRecorder,
    recording,
    duration,
    recordedBlob,
    recordedAudioBuffer,
    chunks,
    initRecorder,
    startRecording,
    stopRecording,
    handleToggleRecording,
  }
}
