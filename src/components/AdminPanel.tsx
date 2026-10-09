import { useCallback, useEffect, useState } from 'react'
import { Check, ShieldCheck, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { removeRecipePhoto } from '../lib/photos'
import { recipeHref } from '../lib/route'
import { btn, btnDanger } from '../lib/ui'

interface ReportRow {
  id: string
  reason: string
  created_at: string
  reporter: { username: string } | null
  recipes: {
    id: string
    title: string
    user_id: string
    photo_path: string | null
  } | null
}

interface Props {
  version: number
  onRecipeDeleted: () => Promise<void>
}

export default function AdminPanel({ version, onRecipeDeleted }: Props) {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(
        'id,reason,created_at,reporter:profiles!reports_reporter_id_fkey(username),recipes!reports_recipe_id_fkey(id,title,user_id,photo_path)',
      )
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setReports(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load, version])

  const dismiss = async (id: string) => {
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) setError(error.message)
    else await load()
  }

  const deleteRecipe = async (recipeId: string, photoPath: string | null) => {
    if (!window.confirm('Apagar esta receita e as respetivas denúncias?')) return
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
    if (error) {
      setError(error.message)
    } else {
      if (photoPath) void removeRecipePhoto(photoPath).catch(() => undefined)
      await load()
      await onRecipeDeleted()
    }
  }

  return (
    <section
      aria-label="Moderação"
      className="rounded-2xl border border-accent/40 bg-card p-5 shadow-sm"
    >
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold">
        <ShieldCheck className="size-5 text-accent" aria-hidden />
        Moderação ({reports.length})
      </h2>

      {error && (
        <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-muted">A carregar…</p>}

      {!loading && reports.length === 0 && (
        <p className="text-sm text-muted">Sem denúncias pendentes.</p>
      )}

      <ul className="flex flex-col gap-4">
        {reports.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-2 border-t border-line pt-4"
          >
            <p className="font-medium">
              {r.recipes ? (
                <a
                  href={recipeHref(r.recipes.id)}
                  className="underline decoration-line underline-offset-4 hover:text-accent"
                >
                  {r.recipes.title}
                </a>
              ) : (
                'Receita removida'
              )}
            </p>
            <p className="text-sm">{r.reason || '(sem motivo)'}</p>
            <p className="text-xs text-muted">
              Denunciada por {r.reporter?.username ?? 'desconhecido'} em{' '}
              {new Date(r.created_at).toLocaleDateString('pt-PT')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void dismiss(r.id)}
                className={btn}
              >
                <Check className="size-4" aria-hidden />
                Ignorar denúncia
              </button>
              {r.recipes && (
                <button
                  type="button"
                  onClick={() =>
                    void deleteRecipe(r.recipes!.id, r.recipes!.photo_path)
                  }
                  className={btnDanger}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Apagar receita
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
