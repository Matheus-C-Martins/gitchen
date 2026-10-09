import { useRef, useState, type FormEvent } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const fieldClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-500/40'
const primaryBtn =
  'rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition hover:bg-orange-700 disabled:opacity-50'
const secondaryBtn =
  'rounded-lg border border-stone-300 px-4 py-2 text-sm transition hover:bg-stone-100 dark:border-stone-600 dark:hover:bg-stone-700'

type Mode = 'signin' | 'signup'

export default function AuthPanel({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const captchaRef = useRef<HCaptcha>(null)

  const redirectTo = window.location.origin + import.meta.env.BASE_URL

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
      options: { redirectTo },
    })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!captchaToken) {
      setMessage('Conclui primeiro o captcha.')
      return
    }
    setBusy(true)
    setMessage(null)
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({
            email,
            password,
            options: { captchaToken },
          })
        : await supabase.auth.signUp({
            email,
            password,
            options: { captchaToken, emailRedirectTo: redirectTo },
          })
    setBusy(false)
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)
    if (error) {
      setMessage(error.message)
    } else if (mode === 'signup' && !data.session) {
      setMessage('Verifica o teu email para confirmar a conta.')
    }
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-md dark:bg-stone-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Inicia sessão para adicionar e gerir as tuas receitas.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={signInWithGitHub} className={primaryBtn}>
            Entrar com GitHub
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={secondaryBtn}
          >
            {open ? 'Fechar' : 'Usar email'}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input
            type="email"
            required
            className={fieldClass}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={8}
            className={fieldClass}
            placeholder="Password (mínimo 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <HCaptcha
            ref={captchaRef}
            sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
              className="text-sm text-orange-600 underline dark:text-orange-400"
            >
              {mode === 'signin' ? 'Criar conta nova' : 'Já tenho conta'}
            </button>
          </div>
        </form>
      )}

      {message && (
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{message}</p>
      )}
    </div>
  )
}
