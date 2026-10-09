import type { SupabaseClient } from '@supabase/supabase-js'
import { recipePhotoUrl } from '../lib/photos'

type Props = {
  supabase: SupabaseClient
  path: string | null | undefined
  alt: string
  className?: string
}

export default function RecipePhoto({ supabase, path, alt, className }: Props) {
  if (!path) return null
  return (
    <img
      src={recipePhotoUrl(supabase, path)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 8 }}
    />
  )
}
