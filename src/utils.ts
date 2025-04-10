export type MimeType =
  | 'audio/webm'
  | 'audio/mp4'
  | 'audio/ogg'
  | 'audio/wav'
  | 'audio/aac'
  | 'audio/amr'
  | undefined

export function getMimeType(): MimeType {
  const types = [
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'audio/aac',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type as MimeType
    }
  }
  return undefined
}
