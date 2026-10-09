import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const primaryBtn =
  'rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition hover:bg-orange-700'
const secondaryBtn =
  'rounded-lg border border-stone-300 px-4 py-2 text-sm transition hover:bg-stone-100 dark:border-stone-600 dark:hover:bg-stone-700'

export default function AuthPanel({ session }: { session: Session | null }) {
  if (session) {
    const meta = session.user.user_metadata as {
      user_name?: string
      avatar_url?: string
    }
    const name = meta.user_name ?? session.user.email ?? 'utilizador'
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-md dark:bg-stone-800">
        <span className="flex items-center gap-2 text-sm">
          {meta.avatar_url && (
            <img
              src={meta.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full"
            />
          )}
          <span>
            Sessão iniciada como <strong>{name}</strong>
          </span>
        </span>
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          className={secondaryBtn}
        >
          Terminar sessão
        </button>
      </div>
    )
  }

  const signInWithGitHub = () =>
    void supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-md dark:bg-stone-800">
      <p className="text-sm text-stone-600 dark:text-stone-300">
        Inicia sessão com o GitHub para adicionar e gerir as tuas receitas.
      </p>
      <button type="button" onClick={signInWithGitHub} className={primaryBtn}>
        Entrar com GitHub
      </button>
    </div>
  )
}
