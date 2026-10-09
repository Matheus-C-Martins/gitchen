import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Link2 } from 'lucide-react'
import type { Recipe, RecipeInput } from '../types'
import { fetchFavoriteIds } from '../lib/favorites'
import { fetchRecipe } from '../lib/recipes'
import { goHome, recipeUrl } from '../lib/route'
import { btn } from '../lib/ui'
import Modal from './Modal'
import RecipeForm from './RecipeForm'
import RecipeView from './RecipeView'

interface Props {
  id: string
  userId: string | undefined
  isAdmin: boolean
  version: number
  suggestions: string[]
  onTagClick: (tag: string) => void
  onToggleFavorite: (recipeId: string, favorite: boolean) => Promise<boolean>
  onUpdate: (
    recipe: Recipe,
    input: RecipeInput,
    tags: string[],
  ) => Promise<boolean>
  onRemove: (recipe: Recipe) => Promise<boolean>
}

export default function RecipePage({
  id,
  userId,
  isAdmin,
  version,
  suggestions,
  onTagClick,
  onToggleFavorite,
  onUpdate,
  onRemove,
}: Props) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetchRecipe(id)
      const favs =
        userId && res.recipe ? await fetchFavoriteIds([id]) : new Set<string>()
      if (cancelled) return
      setRecipe(res.recipe)
      setFavorite(favs.has(id))
      setError(res.error)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id, userId, version])

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

  const handleFavorite = async () => {
    if (!recipe) return
    const next = !favorite
    setFavorite(next)
    const ok = await onToggleFavorite(recipe.id, next)
    if (!ok) setFavorite(!next)
  }

  const handleUpdate = async (
    current: Recipe,
    input: RecipeInput,
    tags: string[],
  ) => {
    const ok = await onUpdate(current, input, tags)
    if (ok) {
      const res = await fetchRecipe(id)
      setRecipe(res.recipe)
      setEditing(false)
    }
    return ok
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <a href="#/" className={btn}>
          <ArrowLeft className="size-4" aria-hidden />
          Todas as receitas
        </a>
        {recipe && (
          <button type="button" onClick={() => void copyLink()} className={btn}>
            {copied ? (
              <Check className="size-4 text-accent" aria-hidden />
            ) : (
              <Link2 className="size-4" aria-hidden />
            )}
            {copied ? 'Ligação copiada' : 'Copiar ligação'}
          </button>
        )}
      </div>

      {loading && (
        <div
          aria-busy
          className="h-96 animate-pulse rounded-3xl border border-line bg-card"
        />
      )}

      {!loading && error && !recipe && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && !recipe && (
        <p className="py-12 text-center text-muted">
          Receita não encontrada. Pode ter sido apagada.
        </p>
      )}

      {recipe && (
        <RecipeView
          recipe={recipe}
          userId={userId}
          isAdmin={isAdmin}
          favorite={favorite}
          onToggleFavorite={() => void handleFavorite()}
          onTagClick={onTagClick}
          onEdit={() => setEditing(true)}
          onDelete={() => void handleDelete()}
        />
      )}

      <Modal
        open={editing && recipe !== null}
        title="Editar receita"
        onClose={() => setEditing(false)}
      >
        {recipe && (
          <RecipeForm
            userId={userId ?? ''}
            initial={recipe}
            suggestions={suggestions}
            submitLabel="Guardar"
            onSubmit={(input, tags) => handleUpdate(recipe, input, tags)}
            onCancel={() => setEditing(false)}
          />
        )}
      </Modal>
    </section>
  )
}
