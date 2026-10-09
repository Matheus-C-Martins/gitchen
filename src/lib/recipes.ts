import { supabase } from './supabase'
import type { Recipe } from '../types'

export const PAGE_SIZE = 10

const RECIPE_SELECT =
  'id,user_id,title,ingredients,steps,photo_path,created_at,profiles!recipes_user_id_fkey(username,avatar_url)'

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export async function fetchRecipesPage(
  page: number,
  search: string,
): Promise<{ recipes: Recipe[]; total: number; error: string | null }> {
  const from = page * PAGE_SIZE
  const term = search.trim().toLowerCase()
  const base = supabase.from('recipes').select(RECIPE_SELECT, { count: 'exact' })
  const filtered = term ? base.ilike('search_text', `%${escapeLike(term)}%`) : base
  const { data, count, error } = await filtered
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) return { recipes: [], total: 0, error: error.message }
  return { recipes: data ?? [], total: count ?? 0, error: null }
}

export async function fetchRecipe(
  id: string,
): Promise<{ recipe: Recipe | null; error: string | null }> {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) return { recipe: null, error: error.message }
  return { recipe: data, error: null }
}
