import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const btn =
  'rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-stone-600 dark:text-stone-300 dark:hover:border-amber-500 dark:hover:bg-stone-700 dark:hover:text-amber-400'

export default function ReportButton({ recipeId }: { recipeId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    const { error } = await supabase
      .from('reports')
      .insert({ recipe_id: recipeId, reason: reason.trim() })
    setSending(false)
    if (error) {
      setError(
        error.code === '23505'
          ? 'Já denunciaste esta receita.'
          : error.message,
      )
    } else {
      setSent(true)
      setOpen(false)
    }
  }

  if (sent) {
    return (
      <span className="text-sm text-stone-500 dark:text-stone-400">
        Denúncia enviada. Obrigado.
      </span>
    )
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={btn}>
          Denunciar
        </button>
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2">
      <textarea
        rows={2}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (opcional, até 500 caracteres)"
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-amber-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          Enviar denúncia
        </button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>
          Cancelar
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  )
}
