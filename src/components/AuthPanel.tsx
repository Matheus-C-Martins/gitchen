import type { Session } from '@supabase/supabase-js'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { btnPrimary, iconBtn } from '../lib/ui'

export default function AuthPanel({ session }: { session: Session | null }) {
  if (session) {
    const meta = session.user.user_metadata as {
      user_name?: string
      avatar_url?: string
    }
    const name = meta.user_name ?? session.user.email ?? 'utilizador'
    return (
      <div className="flex items-center gap-1.5">
        {meta.avatar_url ? (
          <img
            src={meta.avatar_url}
            alt=""
            className="size-8 rounded-full ring-2 ring-line"
          />
        ) : (
          <UserRound className="size-6 text-muted" aria-hidden />
        )}
        <span
          className="hidden max-w-36 truncate text-sm sm:inline"
          title={`Sessão iniciada como ${name}`}
        >
          {name}
        </span>
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          aria-label="Terminar sessão"
          title="Terminar sessão"
          className={iconBtn}
        >
          <LogOut className="size-5" aria-hidden />
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
    <button type="button" onClick={signInWithGitHub} className={btnPrimary}>
      <LogIn className="size-4" aria-hidden />
      Entrar<span className="hidden sm:inline"> com GitHub</span>
    </button>
  )
}
