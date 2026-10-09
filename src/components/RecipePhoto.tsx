import { recipePhotoUrl } from '../lib/photos'

interface Props {
  path: string | null | undefined
  alt: string
}

export default function RecipePhoto({ path, alt }: Props) {
  if (!path) return null
  return (
    <img
      src={recipePhotoUrl(path)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-full rounded-lg object-cover"
      style={{ aspectRatio: '4 / 3' }}
    />
  )
}
