import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { removeRecipePhoto } from './lib/photos'
import {
  PAGE_SIZE,
  fetchRecipesPage,
  fetchTagCounts,
  saveRecipeTags,
  type TagCount,
} from './lib/recipes'
import { goHome, useHashRoute } from './lib/route'
import { sameTags } from './lib/tags'
import type { Recipe, RecipeInput } from './types'
import AuthPanel from './components/AuthPanel'
import RecipeForm from './components/RecipeForm'
import RecipeView from './components/RecipeView'
import RecipePage from './components/RecipePage'
import Pagination from './components/Pagination'
import AdminPanel from './components/AdminPanel'

const THEME_KEY = 'gitchen:theme'

type Theme = 'light' | 'dark'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-500/40'

const chipBase = 'rounded-full px-3 py-0.5 text-sm transition'
const chipOff =
  'bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
const chipOn = 'bg-orange-600 text-white hover:bg-orange-700'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminVersion, setAdminVersion] = useState(0)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [tagCounts, setTagCounts] = useState<TagCount[]>([])
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const requestRef = useRef(0)

  const route = useHashRoute()
  const routeId = route.name === 'recipe' ? route.id : null
  const userId = session?.user.id
  const suggestions = tagCounts.map((t) => t.name)
  const error = actionError ?? listError

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false)
      return
    }
    void supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true))
  }, [userId])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [routeId])

  useEffect(() => {
    const request = ++requestRef.current
    void fetchRecipesPage(page, debouncedQuery, tag).then((res) => {
      if (request !== requestRef.current) return
      if (res.error) {
        setListError(res.error)
        setLoading(false)
        return
      }
      const lastPage = Math.max(0, Math.ceil(res.total / PAGE_SIZE) - 1)
      if (page > lastPage) {
        setPage(lastPage)
        return
      }
      setListError(null)
      setRecipes(res.recipes)
      setTotal(res.total)
      setLoading(false)
    })
  }, [page, debouncedQuery, tag, reloadKey])

  useEffect(() => {
    let cancelled = false
    void fetchTagCounts().then((counts) => {
      if (!cancelled) setTagCounts(counts)
    })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const changeQuery = (value: string) => {
    setQuery(value)
    setPage(0)
    setActionError(null)
  }

  const changePage = (next: number) => {
    setPage(next)
    setActionError(null)
    window.scrollTo({ top: 0 })
  }

  const selectTag = (next: string | null) => {
    setTag(next)
    setPage(0)
    setActionError(null)
    if (routeId) goHome()
  }

  const createRecipe = async (
    input: RecipeInput,
    tags: string[],
  ): Promise<boolean> => {
    setActionError(null)
    const { data, error } = await supabase
      .from('recipes')
      .insert(input)
      .select('id')
      .single()
    if (error) {
      setActionError(error.message)
      return false
    }
    if (tags.length > 0) {
      const tagError = await saveRecipeTags(data.id, tags)
      if (tagError) {
        setActionError(
          `Receita criada, mas não foi possível guardar as etiquetas: ${tagError}`,
        )
      }
    }
    setPage(0)
    refresh()
    return true
  }

  const updateRecipe = async (
    recipe: Recipe,
    input: RecipeInput,
    tags: string[],
  ): Promise<boolean> => {
    setActionError(null)
    const { error } = await supabase
      .from('recipes')
      .update(input)
      .eq('id', recipe.id)
    if (error) {
      setActionError(error.message)
      return false
    }
    if (recipe.photo_path && recipe.photo_path !== input.photo_path) {
      void removeRecipePhoto(recipe.photo_path).catch(() => undefined)
    }
    if (!sameTags(recipe.tag_names, tags)) {
      const tagError = await saveRecipeTags(recipe.id, tags)
      if (tagError) {
        setActionError(
          `Receita guardada, mas não foi possível atualizar as etiquetas: ${tagError}`,
        )
      }
    }
    refresh()
    return true
  }

  const removeRecipe = async (recipe: Recipe): Promise<boolean> => {
    if (!window.confirm('Apagar esta receita?')) return false
    setActionError(null)
    const { error } = await supabase.from('recipes').delete().eq('id', recipe.id)
    if (error) {
      setActionError(error.message)
      return false
    }
    if (recipe.photo_path) {
      void removeRecipePhoto(recipe.photo_path).catch(() => undefined)
    }
    setAdminVersion((v) => v + 1)
    refresh()
    return true
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const chips: TagCount[] =
    tag && !tagCounts.some((t) => t.name === tag)
      ? [{ name: tag, count: 0 }, ...tagCounts]
      : tagCounts

  return (
    <div className="min-h-screen bg-amber-50 font-sans text-stone-800 transition-colors dark:bg-stone-900 dark:text-stone-100">
      <main className="mx-auto max-w-2xl px-4 py-10">
        <header className="relative mb-8 text-center">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'
            }
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            className="absolute right-0 top-0 rounded-full border border-stone-300 bg-white p-2 text-xl leading-none shadow-sm transition hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <h1 className="text-4xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
            <a href="#/">🍳 Gitchen</a>
          </h1>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            O livro de receitas de todos
          </p>
        </header>

        <AuthPanel session={session} />

        {isAdmin && (
          <AdminPanel
            version={adminVersion}
            onRecipeDeleted={async () => refresh()}
          />
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {routeId ? (
          <RecipePage
            key={routeId}
            id={routeId}
            userId={userId}
            isAdmin={isAdmin}
            version={reloadKey}
            suggestions={suggestions}
            onTagClick={selectTag}
            onUpdate={updateRecipe}
            onRemove={removeRecipe}
          />
        ) : (
          <>
            {session && (
              <section className="mb-8 rounded-2xl bg-white p-5 shadow-md dark:bg-stone-800">
                <h2 className="mb-3 text-lg font-semibold">Nova receita</h2>
                <RecipeForm
                  userId={session.user.id}
                  suggestions={suggestions}
                  submitLabel="Adicionar receita"
                  onSubmit={createRecipe}
                />
              </section>
            )}

            <input
              className={`${inputClass} mb-3`}
              placeholder="Pesquisar por título ou ingrediente"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
            />

            {chips.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2" aria-label="Filtrar por etiqueta">
                <button
                  type="button"
                  onClick={() => selectTag(null)}
                  className={`${chipBase} ${tag === null ? chipOn : chipOff}`}
                >
                  Todas
                </button>
                {chips.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => selectTag(tag === t.name ? null : t.name)}
                    className={`${chipBase} ${tag === t.name ? chipOn : chipOff}`}
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            )}

            {!loading && (
              <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
                {total === 1 ? '1 receita' : `${total} receitas`}
              </p>
            )}

            {loading && (
              <p className="py-8 text-center text-stone-500 dark:text-stone-400">
                A carregar receitas…
              </p>
            )}

            {!loading && recipes.length === 0 && (
              <p className="py-8 text-center text-stone-500 dark:text-stone-400">
                Sem receitas para mostrar.
              </p>
            )}

            <div className="grid gap-4">
              {recipes.map((r) => (
                <article
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md transition hover:shadow-lg dark:bg-stone-800"
                >
                  {editingId === r.id ? (
                    <RecipeForm
                      userId={userId ?? ''}
                      initial={r}
                      suggestions={suggestions}
                      submitLabel="Guardar"
                      onSubmit={async (input, tags) => {
                        const ok = await updateRecipe(r, input, tags)
                        if (ok) setEditingId(null)
                        return ok
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <RecipeView
                      recipe={r}
                      userId={userId}
                      isAdmin={isAdmin}
                      asLink
                      onTagClick={selectTag}
                      onEdit={() => setEditingId(r.id)}
                      onDelete={() => void removeRecipe(r)}
                    />
                  )}
                </article>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={changePage}
            />
          </>
        )}
      </main>
    </div>
  )
}
