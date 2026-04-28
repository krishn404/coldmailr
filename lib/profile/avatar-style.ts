export function getInitials(value: string | null | undefined) {
  const text = value?.trim()
  if (!text) return 'U'
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const GRADIENTS = [
  'from-fuchsia-700 via-violet-800 to-purple-500',
  'from-sky-600 via-blue-800 to-indigo-500',
  'from-emerald-600 via-teal-800 to-cyan-500',
  'from-amber-500 via-orange-700 to-rose-500',
  'from-pink-600 via-purple-800 to-fuchsia-500',
  'from-slate-600 via-zinc-800 to-neutral-500',
]

export function getAvatarGradient(seed: string | null | undefined) {
  const value = seed?.trim() || 'default'
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return GRADIENTS[hash % GRADIENTS.length]
}

