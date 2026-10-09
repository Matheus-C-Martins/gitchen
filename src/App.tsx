import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Recipe, RecipeInput } from './types'
import AuthPanel from './components/AuthPanel'
import RecipeForm from './components/RecipeForm'

const THEME_KEY = 'gitchen:theme'

type Theme = 'light' | 'dark'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-500/40'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

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

  const loadRecipes = useCallback(async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        'id,user_id,title,ingredients,steps,created_at,profiles(username,avatar_url)',
      )
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setRecipes((data ?? []) as unknown as Recipe[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadRecipes()
  }, [loadRecipes])

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const createRecipe = async (input: RecipeInput) => {
    const { error } = await supabase.from('recipes').insert(input)
    if (error) setError(error.message)
    else await loadRecipes()
  }

  const updateRecipe = async (id: string, input: RecipeInput) => {
    const { error } = await supabase.from('recipes').update(input).eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setEditingId(null)
      await loadRecipes()
    }
  }

  const removeRecipe = async (id: string) => {
    if (!window.confirm('Apagar esta receita?')) return
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) setError(error.message)
    else await loadRecipes()
  }

  const q = query.toLowerCase()
  const visible = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.ingredients.some((i) => i.toLowerCase().includes(q)),
  )

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
            🍳 Gitchen
          </h1>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            O livro de receitas de todos
          </p>
        </header>

        <AuthPanel session={session} />

        {session && (
          <section className="mb-8 rounded-2xl bg-white p-5 shadow-md dark:bg-stone-800">
            <h2 className="mb-3 text-lg font-semibold">Nova receita</h2>
            <RecipeForm submitLabel="Adicionar receita" onSubmit={createRecipe} />
          </section>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <input
          className={`${inputClass} mb-6`}
          placeholder="Pesquisar por título ou ingrediente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading && (
          <p className="py-8 text-center text-stone-500 dark:text-stone-400">
            A carregar receitas…
          </p>
        )}

        {!loading && visible.length === 0 && (
          <p className="py-8 text-center text-stone-500 dark:text-stone-400">
            Sem receitas para mostrar.
          </p>
        )}

        <div className="grid gap-4">
          {visible.map((r) => {
            const isOwner = session?.user.id === r.user_id
            return (
              <article
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md transition hover:shadow-lg dark:bg-stone-800"
              >
                {editingId === r.id ? (
                  <RecipeForm
                    initial={r}
                    submitLabel="Guardar"
                    onSubmit={(input) => updateRecipe(r.id, input)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                      {r.title}
                    </h2>
                    <p className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                      {r.profiles?.avatar_url && (
                        <img
                          src={r.profiles.avatar_url}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      )}
                      <span>por {r.profiles?.username ?? 'desconhecido'}</span>
                    </p>
                    {r.ingredients.length > 0 && (
                      <ul className="list-inside list-disc text-stone-700 dark:text-stone-300">
                        {r.ingredients.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    )}
                    {r.steps && (
                      <p className="whitespace-pre-wrap text-stone-600 dark:text-stone-400">
                        {r.steps}
                      </p>
                    )}
                    {isOwner && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(r.id)}
                          className="rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void removeRecipe(r.id)}
                          className="rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-stone-600 dark:text-stone-300 dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                        >
                          Apagar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}
