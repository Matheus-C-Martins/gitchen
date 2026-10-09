import { useState, type FormEvent } from 'react'
import { Check, Flag, LoaderCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { btn, btnPrimary, inputClass } from '../lib/ui'

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
      <span className="inline-flex items-center gap-2 text-sm text-muted">
        <Check className="size-4 text-accent" aria-hidden />
        Denúncia enviada. Obrigado.
      </span>
    )
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={btn}>
          <Flag className="size-4" aria-hidden />
          Denunciar
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="flex w-full flex-col gap-3 rounded-xl border border-line bg-paper p-3"
    >
      <textarea
        rows={2}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (opcional, até 500 caracteres)"
        aria-label="Motivo da denúncia"
        className={inputClass}
      />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={sending} className={btnPrimary}>
          {sending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          Enviar denúncia
        </button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
