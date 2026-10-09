import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Recipe, RecipeInput } from '../types'
import { removeRecipePhoto } from '../lib/photos'
import PhotoUpload from './PhotoUpload'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-500/40'

interface Props {
  userId: string
  initial?: Recipe
  submitLabel: string
  onSubmit: (input: RecipeInput) => Promise<boolean>
  onCancel?: () => void
}

export default function RecipeForm({
  userId,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [ingredients, setIngredients] = useState(
    initial?.ingredients.join('\n') ?? '',
  )
  const [steps, setSteps] = useState(initial?.steps ?? '')
  const [photoPath, setPhotoPath] = useState<string | null>(
    initial?.photo_path ?? null,
  )
  const [photoKey, setPhotoKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const pendingRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      const pending = pendingRef.current
      if (pending) void removeRecipePhoto(pending).catch(() => undefined)
    },
    [],
  )

  const handlePhoto = (path: string | null) => {
    setPhotoPath(path)
    pendingRef.current = path && path !== initial?.photo_path ? path : null
  }

  const handle = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const sending = pendingRef.current
    pendingRef.current = null
    setBusy(true)
    const ok = await onSubmit({
      title: title.trim(),
      ingredients: ingredients
        .split('\n')
        .map((i) => i.trim())
        .filter(Boolean),
      steps: steps.trim(),
      photo_path: photoPath,
    })
    setBusy(false)
    if (!ok) {
      pendingRef.current = sending
      return
    }
    if (!initial) {
      setTitle('')
      setIngredients('')
      setSteps('')
      setPhotoPath(null)
      setPhotoKey((k) => k + 1)
    }
  }

  return (
    <form onSubmit={(e) => void handle(e)} className="flex flex-col gap-3">
      <input
        className={inputClass}
        placeholder="Título da receita"
        maxLength={120}
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
        maxLength={10000}
        value={steps}
        onChange={(e) => setSteps(e.target.value)}
      />
      <PhotoUpload
        key={photoKey}
        userId={userId}
        value={photoPath}
        onChange={handlePhoto}
        disabled={busy}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm transition hover:bg-stone-100 dark:border-stone-600 dark:hover:bg-stone-700"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
