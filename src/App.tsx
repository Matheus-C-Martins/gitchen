import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  BookOpen,
  ChefHat,
  CircleAlert,
  Heart,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import { fetchFavoriteIds, setFavorite } from './lib/favorites'
import { removeRecipePhoto } from './lib/photos'
import {
  PAGE_SIZE,
  fetchFavoriteRecipesPage,
  fetchRecipesPage,
  fetchTagCounts,
  saveRecipeTags,
  type TagCount,
} from './lib/recipes'
import { goHome, useHashRoute } from './lib/route'
import { sameTags } from './lib/tags'
import {
  btnPrimary,
  chipBase,
  chipOff,
  chipOn,
  iconBtn,
  searchClass,
} from './lib/ui'
import type { Recipe, RecipeInput } from './types'
import AdminPanel from './components/AdminPanel'
import AuthPanel from './components/AuthPanel'
import Modal from './components/Modal'
import Pagination from './components/Pagination'
import RecipeCard from './components/RecipeCard'
import RecipeForm from './components/RecipeForm'
import RecipePage from './components/RecipePage'

const THEME_KEY = 'gitchen:theme'

type Theme = 'light' | 'dark'

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
  const [favIds, setFavIds] = useState<Set<string>>(new Set())
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [tagCounts, setTagCounts] = useState<TagCount[]>([])
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const requestRef = useRef(0)

  const route = useHashRoute()
  const routeId = route.name === 'recipe' ? route.id : null
  const userId = session?.user.id
  const onlyFavorites = favoritesOnly && userId !== undefined
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
    void (async () => {
      const res = onlyFavorites
        ? await fetchFavoriteRecipesPage(page, debouncedQuery, tag)
        : await fetchRecipesPage(page, debouncedQuery, tag)
      const favs =
        userId && !res.error
          ? await fetchFavoriteIds(res.recipes.map((r) => r.id))
          : new Set<string>()
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
      setFavIds(favs)
      setTotal(res.total)
      setLoading(false)
    })()
  }, [page, debouncedQuery, tag, onlyFavorites, userId, reloadKey])

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

  const toggleFavoritesOnly = () => {
    setFavoritesOnly((v) => !v)
    setPage(0)
    setActionError(null)
  }

  const toggleFavorite = async (
    recipeId: string,
    favorite: boolean,
  ): Promise<boolean> => {
    setActionError(null)
    const failure = await setFavorite(recipeId, favorite)
    if (failure) {
      setActionError(failure)
      return false
    }
    if (onlyFavorites && !favorite) refresh()
    return true
  }

  const markFavorite = (recipeId: string, favorite: boolean) =>
    setFavIds((prev) => {
      const next = new Set(prev)
      if (favorite) next.add(recipeId)
      else next.delete(recipeId)
      return next
    })

  const handleListFavorite = async (recipeId: string, favorite: boolean) => {
    markFavorite(recipeId, favorite)
    const ok = await toggleFavorite(recipeId, favorite)
    if (!ok) markFavorite(recipeId, !favorite)
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
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <a
            href="#/"
            className="flex items-center gap-2 font-serif text-xl font-semibold"
          >
            <ChefHat className="size-6 text-accent" aria-hidden />
            Gitchen
          </a>
          <div className="flex items-center gap-2">
            <AuthPanel session={session} />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Mudar para tema claro'
                  : 'Mudar para tema escuro'
              }
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              className={iconBtn}
            >
              {theme === 'dark' ? (
                <Sun className="size-5" aria-hidden />
              ) : (
                <Moon className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6 sm:pb-12">
        {isAdmin && (
          <div className="mt-6">
            <AdminPanel
              version={adminVersion}
              onRecipeDeleted={async () => refresh()}
            />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {routeId ? (
          <div className="mx-auto mt-6 max-w-4xl sm:mt-8">
            <RecipePage
              key={routeId}
              id={routeId}
              userId={userId}
              isAdmin={isAdmin}
              version={reloadKey}
              suggestions={suggestions}
              onTagClick={selectTag}
              onToggleFavorite={toggleFavorite}
              onUpdate={updateRecipe}
              onRemove={removeRecipe}
            />
          </div>
        ) : (
          <>
            <section className="cover mt-6 rounded-3xl px-5 py-10 text-center sm:mt-10 sm:px-10 sm:py-14">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                O livro de receitas de todos
              </p>
              <h1 className="mt-3 font-serif text-5xl font-semibold tracking-tight sm:text-7xl">
                Gitchen
              </h1>
              <div className="ornament mx-auto mt-5 max-w-xs" aria-hidden>
                <ChefHat className="size-5" />
              </div>
              <p className="mx-auto mt-4 max-w-md text-balance text-muted">
                Receitas partilhadas por quem cozinha. Lê, guarda as tuas
                favoritas e junta as tuas.
              </p>

              <div className="relative mx-auto mt-7 max-w-lg">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  type="search"
                  aria-label="Pesquisar receitas"
                  placeholder="Pesquisar por título ou ingrediente"
                  value={query}
                  onChange={(e) => changeQuery(e.target.value)}
                  className={searchClass}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Limpar pesquisa"
                    title="Limpar pesquisa"
                    onClick={() => changeQuery('')}
                    className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-accent-soft hover:text-ink"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </div>

              <div className="mt-6 hidden sm:block">
                {session ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className={btnPrimary}
                  >
                    <Plus className="size-4" aria-hidden />
                    Nova receita
                  </button>
                ) : (
                  <p className="text-sm text-muted">
                    Inicia sessão com o GitHub para adicionar e gerir as tuas
                    receitas.
                  </p>
                )}
              </div>
            </section>

            {(session || chips.length > 0) && (
              <section aria-label="Índice" className="mt-8">
                <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold">
                  <BookOpen className="size-5 text-accent" aria-hidden />
                  Índice
                </h2>
                <div
                  role="group"
                  aria-label="Filtros"
                  className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
                >
                  {session && (
                    <button
                      type="button"
                      aria-pressed={onlyFavorites}
                      onClick={toggleFavoritesOnly}
                      className={`${chipBase} ${onlyFavorites ? chipOn : chipOff}`}
                    >
                      <Heart
                        className="size-4"
                        fill={onlyFavorites ? 'currentColor' : 'none'}
                        aria-hidden
                      />
                      Favoritas
                    </button>
                  )}
                  {chips.length > 0 && (
                    <button
                      type="button"
                      onClick={() => selectTag(null)}
                      className={`${chipBase} ${tag === null ? chipOn : chipOff}`}
                    >
                      Todas
                    </button>
                  )}
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
              </section>
            )}

            <div className="mb-5 mt-8 flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-2xl font-semibold">Receitas</h2>
              {!loading && (
                <p className="text-sm text-muted">
                  {total === 1 ? '1 receita' : `${total} receitas`}
                </p>
              )}
            </div>

            {loading && recipes.length === 0 && (
              <div
                aria-busy
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-2xl border border-line bg-card"
                  />
                ))}
              </div>
            )}

            {!loading && recipes.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
                <ChefHat className="size-12 text-accent/50" aria-hidden />
                <p>
                  {onlyFavorites && !tag && !debouncedQuery
                    ? 'Ainda não tens receitas favoritas.'
                    : 'Sem receitas para mostrar.'}
                </p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  loggedIn={session !== null}
                  favorite={favIds.has(r.id)}
                  onToggleFavorite={() =>
                    void handleListFavorite(r.id, !favIds.has(r.id))
                  }
                  onTagClick={selectTag}
                />
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

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        Gitchen · O livro de receitas de todos
      </footer>

      {session && !routeId && (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          aria-label="Nova receita"
          title="Nova receita"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-xl transition active:scale-95 sm:hidden"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      )}

      <Modal
        open={createOpen && session !== null}
        title="Nova receita"
        onClose={() => setCreateOpen(false)}
      >
        <RecipeForm
          userId={userId ?? ''}
          suggestions={suggestions}
          submitLabel="Adicionar receita"
          onSubmit={async (input, tags) => {
            const ok = await createRecipe(input, tags)
            if (ok) setCreateOpen(false)
            return ok
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  )
}
