import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface ReportRow {
  id: string
  reason: string
  created_at: string
  reporter: { username: string } | null
  recipes: { id: string; title: string; user_id: string } | null
}

interface Props {
  version: number
  onRecipeDeleted: () => Promise<void>
}

const btn =
  'rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700'
const dangerBtn =
  'rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-stone-600 dark:text-stone-300 dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400'

export default function AdminPanel({ version, onRecipeDeleted }: Props) {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(
        'id,reason,created_at,reporter:profiles!reports_reporter_id_fkey(username),recipes!reports_recipe_id_fkey(id,title,user_id)',
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

  const deleteRecipe = async (recipeId: string) => {
    if (!window.confirm('Apagar esta receita e as respetivas denúncias?')) return
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
    if (error) {
      setError(error.message)
    } else {
      await load()
      await onRecipeDeleted()
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-amber-300 bg-white p-5 shadow-md dark:border-amber-700 dark:bg-stone-800">
      <h2 className="mb-3 text-lg font-semibold">
        Moderação ({reports.length})
      </h2>

      {error && (
        <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-stone-500 dark:text-stone-400">A carregar…</p>
      )}

      {!loading && reports.length === 0 && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Sem denúncias pendentes.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {reports.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-2 border-t border-stone-200 pt-3 dark:border-stone-700"
          >
            <p className="font-medium">
              {r.recipes?.title ?? 'Receita removida'}
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {r.reason || '(sem motivo)'}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Denunciada por {r.reporter?.username ?? 'desconhecido'} em{' '}
              {new Date(r.created_at).toLocaleDateString('pt-PT')}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => void dismiss(r.id)} className={btn}>
                Ignorar denúncia
              </button>
              {r.recipes && (
                <button
                  type="button"
                  onClick={() => void deleteRecipe(r.recipes!.id)}
                  className={dangerBtn}
                >
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
