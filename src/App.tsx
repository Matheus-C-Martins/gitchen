import { useEffect, useState, type FormEvent } from 'react'
import type { Recipe } from './types'

const STORAGE_KEY = 'gitchen:recipes'
const THEME_KEY = 'gitchen:theme'

type Theme = 'light' | 'dark'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-500/40'

function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Recipe[]) : []
  } catch {
    return []
  }
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes)
  const [title, setTitle] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const addRecipe = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      title: title.trim(),
      ingredients: ingredients.split('\n').map((i) => i.trim()).filter(Boolean),
      steps: steps.trim(),
    }
    setRecipes((prev) => [recipe, ...prev])
    setTitle('')
    setIngredients('')
    setSteps('')
  }

  const removeRecipe = (id: string) =>
    setRecipes((prev) => prev.filter((r) => r.id !== id))

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
            O teu livro de receitas
          </p>
        </header>

        <form
          onSubmit={addRecipe}
          className="mb-8 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md dark:bg-stone-800"
        >
          <h2 className="text-lg font-semibold">Nova receita</h2>
          <input
            className={inputClass}
            placeholder="Título da receita"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className={inputClass}
            placeholder="Ingredientes (um por linha)"
            rows={4}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <textarea
            className={inputClass}
            placeholder="Modo de preparação"
            rows={4}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition hover:bg-orange-700 active:scale-95"
          >
            Adicionar receita
          </button>
        </form>

        <input
          className={`${inputClass} mb-6`}
          placeholder="Pesquisar por título ou ingrediente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {visible.length === 0 && (
          <p className="py-8 text-center text-stone-500 dark:text-stone-400">
            Sem receitas para mostrar.
          </p>
        )}

        <div className="grid gap-4">
          {visible.map((r) => (
            <article
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md transition hover:shadow-lg dark:bg-stone-800"
            >
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                {r.title}
              </h2>
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
              <button
                onClick={() => removeRecipe(r.id)}
                className="self-start rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-stone-600 dark:text-stone-300 dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                Remover
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
