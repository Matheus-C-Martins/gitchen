export const MAX_TAGS = 5
export const MAX_TAG_LENGTH = 30

export function normalizeTag(value: string): string {
  return value.replace(/,/g, ' ').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function sameTags(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((t) => set.has(t))
}
