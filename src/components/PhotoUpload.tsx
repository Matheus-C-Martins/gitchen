import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { removeRecipePhoto, uploadRecipePhoto } from '../lib/photos'
import { btn } from '../lib/ui'
import RecipePhoto from './RecipePhoto'

interface Props {
  userId: string
  value: string | null
  onChange: (path: string | null) => void
  disabled?: boolean
}

export default function PhotoUpload({ userId, value, onChange, disabled }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uploadedHere = useRef<string | null>(null)
  const blocked = Boolean(disabled) || busy

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
      <span className="text-sm font-medium">Fotografia</span>
      <RecipePhoto
        path={value}
        alt="Fotografia da receita"
        className="aspect-[4/3] w-full rounded-xl"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label
          aria-disabled={blocked}
          className={`${btn} cursor-pointer focus-within:outline-2 focus-within:outline-accent ${
            blocked ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-4" aria-hidden />
          )}
          {busy ? 'A enviar…' : value ? 'Trocar fotografia' : 'Adicionar fotografia'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => void handleFile(e)}
            disabled={blocked}
            className="sr-only"
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={blocked}
            className={btn}
          >
            <Trash2 className="size-4" aria-hidden />
            Remover foto
          </button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  )
}
