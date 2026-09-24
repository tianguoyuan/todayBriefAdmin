export function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return Math.abs(hash)
}

export function genId(prefix = 'id') {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
