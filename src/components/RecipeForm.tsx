import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Recipe, RecipeInput } from '../types'
import { removeRecipePhoto } from '../lib/photos'
import { MAX_TAGS, MAX_TAG_LENGTH, normalizeTag } from '../lib/tags'
import PhotoUpload from './PhotoUpload'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-500/40'

interface Props {
  userId: string
  initial?: Recipe
  suggestions?: string[]
  submitLabel: string
  onSubmit: (input: RecipeInput, tags: string[]) => Promise<boolean>
  onCancel?: () => void
}

export default function RecipeForm({
  userId,
  initial,
  suggestions = [],
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
  const [tags, setTags] = useState<string[]>(initial?.tag_names ?? [])
  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pendingRef = useRef<string | null>(null)
  const listId = useId()

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

  const addDraft = (): string[] | null => {
    const name = normalizeTag(tagDraft)
    if (!name) return tags
    if (name.length > MAX_TAG_LENGTH) {
      setTagError(`A etiqueta pode ter no máximo ${MAX_TAG_LENGTH} carateres.`)
      return null
    }
    if (tags.includes(name)) {
      setTagDraft('')
      setTagError(null)
      return tags
    }
    if (tags.length >= MAX_TAGS) {
      setTagError(`Máximo de ${MAX_TAGS} etiquetas.`)
      return null
    }
    const next = [...tags, name]
    setTags(next)
    setTagDraft('')
    setTagError(null)
    return next
  }

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addDraft()
    }
  }

  const handle = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const finalTags = addDraft()
    if (!finalTags) return
    const sending = pendingRef.current
    pendingRef.current = null
    setBusy(true)
    const ok = await onSubmit(
      {
        title: title.trim(),
        ingredients: ingredients
          .split('\n')
          .map((i) => i.trim())
          .filter(Boolean),
        steps: steps.trim(),
        photo_path: photoPath,
      },
      finalTags,
    )
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
      setTags([])
      setTagDraft('')
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
      <div className="flex flex-col gap-2">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-0.5 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200"
              >
                #{t}
                <button
                  type="button"
                  aria-label={`Remover etiqueta ${t}`}
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          className={inputClass}
          list={listId}
          placeholder={
            tags.length >= MAX_TAGS
              ? 'Máximo de etiquetas atingido'
              : 'Etiquetas (Enter para adicionar, até 5)'
          }
          maxLength={60}
          disabled={tags.length >= MAX_TAGS}
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={handleTagKey}
          onBlur={() => void addDraft()}
        />
        <datalist id={listId}>
          {suggestions
            .filter((s) => !tags.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
        {tagError && (
          <p className="text-sm text-red-600 dark:text-red-400">{tagError}</p>
        )}
      </div>
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
