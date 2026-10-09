import { ChefHat } from 'lucide-react'
import { recipePhotoUrl } from '../lib/photos'

interface Props {
  path: string | null | undefined
  alt: string
  className?: string
  fallback?: boolean
}

export default function RecipePhoto({
  path,
  alt,
  className = '',
  fallback = false,
}: Props) {
  if (!path) {
    if (!fallback) return null
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center bg-accent-soft text-accent/50 ${className}`}
      >
        <ChefHat className="size-12" />
      </div>
    )
  }
  return (
    <img
      src={recipePhotoUrl(path)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
    />
  )
}
