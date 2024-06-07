import { useEffect, useRef, useState } from 'react'
import { getMimeType } from './utils'
import { webmFixDuration } from './blob-fix'
import { SAMPLING_RATE } from './constants'
export function useMediaRecorder() {
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const initRecorder = async () => {
    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
    }
  }
  const [recordedAudioBuffer, setRecordedAudioBuffer] =
    useState<AudioBuffer | null>(null)
  const startRecording = async (completeCallback?: () => void) => {
    setRecordedBlob(null)
    const startTime = Date.now()
    try {
      if (!streamRef.current) {
        await initRecorder()
      }
      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: getMimeType(),
      })
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.addEventListener('dataavailable', async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
        if (mediaRecorder.state === 'inactive') {
          const duration = Date.now() - startTime
          let blob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType,
          })
          if (getMimeType() === 'audio/webm') {
            blob = await webmFixDuration(blob, duration, blob.type)
          }
          setRecordedBlob(blob)
          if (!recordedBlob?.size) {
            return
          }
          const fileReader = new FileReader()
          fileReader.onloadend = async () => {
            const audioCTX = new AudioContext({
              sampleRate: SAMPLING_RATE,
            })
            setRecordedAudioBuffer(
              await audioCTX.decodeAudioData(fileReader.result as ArrayBuffer),
            )
            completeCallback?.()
          }
          fileReader.readAsArrayBuffer(recordedBlob)
          chunksRef.current = []
        }
      })
      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop() // set state to inactive
      setDuration(0)
      setRecording(false)
    }
  }

  useEffect(() => {
    const stream: MediaStream | null = null

    if (recording) {
      const timer = setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1)
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
  }, [recording])
  const handleToggleRecording = (completeCallback?: () => void) => {
    if (recording) {
      stopRecording()
    } else {
      startRecording(completeCallback)
    }
  }
  return {
    streamRef,
    mediaRecorderRef,
    recording,
    duration,
    recordedBlob,
    recordedAudioBuffer,
    chunksRef,
    initRecorder,
    startRecording,
    stopRecording,
    handleToggleRecording,
  }
}
