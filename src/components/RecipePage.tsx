import { useEffect, useState } from 'react'
import type { Recipe, RecipeInput } from '../types'
import { fetchRecipe } from '../lib/recipes'
import { goHome, recipeUrl } from '../lib/route'
import RecipeForm from './RecipeForm'
import RecipeView from './RecipeView'

interface Props {
  id: string
  userId: string | undefined
  isAdmin: boolean
  version: number
  onUpdate: (recipe: Recipe, input: RecipeInput) => Promise<boolean>
  onRemove: (recipe: Recipe) => Promise<boolean>
}

const linkBtn =
  'rounded-lg border border-stone-300 bg-white px-3 py-1 text-sm text-stone-600 transition hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'

export default function RecipePage({
  id,
  userId,
  isAdmin,
  version,
  onUpdate,
  onRemove,
}: Props) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchRecipe(id).then((res) => {
      if (cancelled) return
      setRecipe(res.recipe)
      setError(res.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, version])

  useEffect(() => {
    const previous = document.title
    if (recipe) document.title = `${recipe.title} · Gitchen`
    return () => {
      document.title = previous
    }
  }, [recipe])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl(id))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Não foi possível copiar a ligação.')
    }
  }

  const handleDelete = async () => {
    if (!recipe) return
    if (await onRemove(recipe)) goHome()
  }

  const handleUpdate = async (current: Recipe, input: RecipeInput) => {
    const ok = await onUpdate(current, input)
    if (ok) {
      const res = await fetchRecipe(id)
      setRecipe(res.recipe)
      setEditing(false)
    }
    return ok
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <a href="#/" className={linkBtn}>
          ← Todas as receitas
        </a>
        {recipe && (
          <button type="button" onClick={() => void copyLink()} className={linkBtn}>
            {copied ? 'Ligação copiada' : 'Copiar ligação'}
          </button>
        )}
      </div>

      {loading && (
        <p className="py-8 text-center text-stone-500 dark:text-stone-400">
          A carregar receita…
        </p>
      )}

      {!loading && error && !recipe && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && !recipe && (
        <p className="py-8 text-center text-stone-500 dark:text-stone-400">
          Receita não encontrada. Pode ter sido apagada.
        </p>
      )}

      {recipe && (
        <article className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md dark:bg-stone-800">
          {editing ? (
            <RecipeForm
              userId={userId ?? ''}
              initial={recipe}
              submitLabel="Guardar"
              onSubmit={(input) => handleUpdate(recipe, input)}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <RecipeView
              recipe={recipe}
              userId={userId}
              isAdmin={isAdmin}
              onEdit={() => setEditing(true)}
              onDelete={() => void handleDelete()}
            />
          )}
        </article>
      )}
    </section>
  )
}
