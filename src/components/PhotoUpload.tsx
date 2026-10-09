import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { removeRecipePhoto, uploadRecipePhoto } from '../lib/photos'
import RecipePhoto from './RecipePhoto'

type Props = {
  supabase: SupabaseClient
  userId: string
  value: string | null
  onChange: (path: string | null) => void
  disabled?: boolean
}

export default function PhotoUpload({ supabase, userId, value, onChange, disabled }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uploadedHere = useRef<string | null>(null)

  async function discardPending() {
    const pending = uploadedHere.current
    uploadedHere.current = null
    if (pending) {
      try {
        await removeRecipePhoto(supabase, pending)
      } catch {
        /* ficheiro órfão: sem impacto para o utilizador */
      }
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const path = await uploadRecipePhoto(supabase, userId, file)
      await discardPending()
      uploadedHere.current = path
      onChange(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a fotografia.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    await discardPending()
    onChange(null)
  }

  return (
    <div>
      <RecipePhoto supabase={supabase} path={value} alt="Fotografia da receita" />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            disabled={disabled || busy}
          />
        </label>
        {value && (
          <button type="button" onClick={handleRemove} disabled={disabled || busy}>
            Remover foto
          </button>
        )}
        {busy && <span>A enviar…</span>}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
