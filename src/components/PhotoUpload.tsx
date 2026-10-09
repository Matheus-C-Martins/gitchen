import { useRef, useState, type ChangeEvent } from 'react'
import { removeRecipePhoto, uploadRecipePhoto } from '../lib/photos'
import RecipePhoto from './RecipePhoto'

interface Props {
  userId: string
  value: string | null
  onChange: (path: string | null) => void
  disabled?: boolean
}

const btn =
  'rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700'

export default function PhotoUpload({ userId, value, onChange, disabled }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uploadedHere = useRef<string | null>(null)

  const discardPending = async () => {
    const pending = uploadedHere.current
    uploadedHere.current = null
    if (pending) {
      try {
        await removeRecipePhoto(pending)
      } catch {
        // ficheiro órfão: sem impacto para o utilizador
      }
    }
  }

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const path = await uploadRecipePhoto(userId, file)
      await discardPending()
      uploadedHere.current = path
      onChange(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a fotografia.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    await discardPending()
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <RecipePhoto path={value} alt="Fotografia da receita" />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void handleFile(e)}
          disabled={disabled || busy}
          className="text-sm text-stone-600 dark:text-stone-300"
        />
        {value && (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={disabled || busy}
            className={btn}
          >
            Remover foto
          </button>
        )}
        {busy && (
          <span className="text-sm text-stone-500 dark:text-stone-400">
            A enviar…
          </span>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  )
}
