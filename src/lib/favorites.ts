import { supabase } from './supabase'

export async function fetchFavoriteIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const { data, error } = await supabase
    .from('favorites')
    .select('recipe_id')
    .in('recipe_id', ids)
  if (error || !data) return new Set()
  return new Set(data.map((f) => f.recipe_id))
}

export async function setFavorite(
  recipeId: string,
  favorite: boolean,
): Promise<string | null> {
  if (favorite) {
    const { error } = await supabase
      .from('favorites')
      .insert({ recipe_id: recipeId })
    if (!error || error.code === '23505') return null
    if (error.code === '42501') return 'Atingiste o limite de 500 favoritos.'
    return error.message
  }
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('recipe_id', recipeId)
  return error ? error.message : null
}
