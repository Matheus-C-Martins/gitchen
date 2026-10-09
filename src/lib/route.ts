import { useEffect, useState } from 'react'

export type Route = { name: 'list' } | { name: 'recipe'; id: string }

const RECIPE_HASH = /^#\/receita\/([0-9a-f-]{36})$/i

export function parseHash(hash: string): Route {
  const match = RECIPE_HASH.exec(hash)
  return match ? { name: 'recipe', id: match[1] } : { name: 'list' }
}

export function recipeHref(id: string): string {
  return `#/receita/${id}`
}

export function recipeUrl(id: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}${recipeHref(id)}`
}

export function goHome(): void {
  window.location.hash = '#/'
}

export function useHashRoute(): Route {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parseHash(hash)
}
