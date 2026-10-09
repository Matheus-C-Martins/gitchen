import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Check, LoaderCircle, X } from 'lucide-react'
import type { Recipe, RecipeInput } from '../types'
import { removeRecipePhoto } from '../lib/photos'
import { MAX_TAGS, MAX_TAG_LENGTH, normalizeTag } from '../lib/tags'
import { btn, btnPrimary, inputClass, tagPill } from '../lib/ui'
import PhotoUpload from './PhotoUpload'

interface Props {
  userId: string
  initial?: Recipe
  suggestions?: string[]
  submitLabel: string
  onSubmit: (input: RecipeInput, tags: string[]) => Promise<boolean>
  onCancel?: () => void
}

const field = 'flex flex-col gap-1.5'
const fieldLabel = 'text-sm font-medium'

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
    <form onSubmit={(e) => void handle(e)} className="flex flex-col gap-5">
      <label className={field}>
        <span className={fieldLabel}>Título</span>
        <input
          className={inputClass}
          placeholder="Ex.: Bacalhau à Brás"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className={field}>
        <span className={fieldLabel}>Ingredientes</span>
        <textarea
          className={inputClass}
          placeholder="Um por linha"
          rows={5}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
      </label>

      <label className={field}>
        <span className={fieldLabel}>Modo de preparação</span>
        <textarea
          className={inputClass}
          placeholder="Um passo por linha"
          rows={6}
          maxLength={10000}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
        />
      </label>

      <div className={field}>
        <label htmlFor={`${listId}-tags`} className={fieldLabel}>
          Etiquetas
        </label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className={`${tagPill} min-h-8 pl-3 text-sm`}>
                #{t}
                <button
                  type="button"
                  aria-label={`Remover etiqueta ${t}`}
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="inline-flex size-6 items-center justify-center rounded-full hover:bg-accent/15"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          id={`${listId}-tags`}
          className={inputClass}
          list={listId}
          placeholder={
            tags.length >= MAX_TAGS
              ? 'Máximo de etiquetas atingido'
              : 'Enter para adicionar (até 5)'
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
        {tagError && <p className="text-sm text-danger">{tagError}</p>}
      </div>

      <PhotoUpload
        key={photoKey}
        userId={userId}
        value={photoPath}
        onChange={handlePhoto}
        disabled={busy}
      />

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={btn}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
