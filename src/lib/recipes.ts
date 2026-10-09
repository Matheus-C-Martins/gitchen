import { supabase } from './supabase'
import type { Recipe } from '../types'

export const PAGE_SIZE = 10

const RECIPE_SELECT =
  'id,user_id,title,ingredients,steps,photo_path,tag_names,created_at,profiles!recipes_user_id_fkey(username,avatar_url)'

export interface TagCount {
  name: string
  count: number
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export async function fetchRecipesPage(
  page: number,
  search: string,
  tag: string | null,
): Promise<{ recipes: Recipe[]; total: number; error: string | null }> {
  const from = page * PAGE_SIZE
  const term = search.trim().toLowerCase()
  const base = supabase.from('recipes').select(RECIPE_SELECT, { count: 'exact' })
  const searched = term ? base.ilike('search_text', `%${escapeLike(term)}%`) : base
  const filtered = tag ? searched.contains('tag_names', [tag]) : searched
  const { data, count, error } = await filtered
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) return { recipes: [], total: 0, error: error.message }
  return { recipes: data ?? [], total: count ?? 0, error: null }
}

export async function fetchFavoriteRecipesPage(
  page: number,
  search: string,
  tag: string | null,
): Promise<{ recipes: Recipe[]; total: number; error: string | null }> {
  const from = page * PAGE_SIZE
  const term = search.trim().toLowerCase()
  const base = supabase
    .from('favorites')
    .select(
      'created_at,recipes!inner(id,user_id,title,ingredients,steps,photo_path,tag_names,created_at,profiles!recipes_user_id_fkey(username,avatar_url))',
      { count: 'exact' },
    )
  const searched = term
    ? base.ilike('recipes.search_text', `%${escapeLike(term)}%`)
    : base
  const filtered = tag ? searched.contains('recipes.tag_names', [tag]) : searched
  const { data, count, error } = await filtered
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) return { recipes: [], total: 0, error: error.message }
  return {
    recipes: (data ?? []).map((f) => f.recipes),
    total: count ?? 0,
    error: null,
  }
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

export async function saveRecipeTags(
  recipeId: string,
  names: string[],
): Promise<string | null> {
  const { error } = await supabase.rpc('set_recipe_tags', {
    p_recipe_id: recipeId,
    p_names: names,
  })
  return error ? error.message : null
}

export async function fetchTagCounts(limit = 30): Promise<TagCount[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('name,recipe_tags(count)')
  if (error || !data) return []
  return data
    .map((t) => ({ name: t.name, count: t.recipe_tags[0]?.count ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
}
