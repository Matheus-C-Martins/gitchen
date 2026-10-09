import { ChefHat, Heart, Pencil, Trash2 } from 'lucide-react'
import type { Recipe } from '../types'
import { btn, btnActive, btnDanger, tagPill } from '../lib/ui'
import RecipePhoto from './RecipePhoto'
import ReportButton from './ReportButton'

interface Props {
  recipe: Recipe
  userId: string | undefined
  isAdmin: boolean
  favorite: boolean
  onToggleFavorite: () => void
  onTagClick: (tag: string) => void
  onEdit: () => void
  onDelete: () => void
}

export default function RecipeView({
  recipe: r,
  userId,
  isAdmin,
  favorite,
  onToggleFavorite,
  onTagClick,
  onEdit,
  onDelete,
}: Props) {
  const isOwner = userId === r.user_id
  const loggedIn = userId !== undefined
  const steps = r.steps
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const date = new Date(r.created_at).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
      <RecipePhoto
        path={r.photo_path}
        alt={r.title}
        className="aspect-[16/10] max-h-[26rem] w-full sm:aspect-[16/8]"
      />

      <div className="p-5 sm:p-10">
        <header className="text-center">
          {r.tag_names.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {r.tag_names.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTagClick(t)}
                  className={`${tagPill} min-h-8 px-3 text-sm transition hover:brightness-95`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {r.title}
          </h1>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              {r.profiles?.avatar_url && (
                <img
                  src={r.profiles.avatar_url}
                  alt=""
                  className="size-6 rounded-full"
                />
              )}
              por {r.profiles?.username ?? 'desconhecido'}
            </span>
            <span aria-hidden>·</span>
            <time dateTime={r.created_at}>{date}</time>
          </p>
        </header>

        <div className="ornament my-8" aria-hidden>
          <ChefHat className="size-5" />
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
          <section aria-labelledby="ingredientes">
            <h2 id="ingredientes" className="font-serif text-2xl font-semibold">
              Ingredientes
            </h2>
            {r.ingredients.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {r.ingredients.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-3 py-2.5">
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Sem ingredientes indicados.</p>
            )}
          </section>

          <section aria-labelledby="preparacao">
            <h2 id="preparacao" className="font-serif text-2xl font-semibold">
              Modo de preparação
            </h2>
            {steps.length > 0 ? (
              <ol className="mt-3 flex flex-col gap-4">
                {steps.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-serif text-sm font-semibold text-accent"
                    >
                      {idx + 1}
                    </span>
                    <p className="pt-0.5 leading-relaxed">{s}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted">Sem modo de preparação indicado.</p>
            )}
          </section>
        </div>

        {loggedIn && (
          <div className="mt-10 flex flex-wrap items-start gap-2 border-t border-line pt-6">
            <button
              type="button"
              aria-pressed={favorite}
              onClick={onToggleFavorite}
              className={favorite ? btnActive : btn}
            >
              <Heart
                className="size-4"
                fill={favorite ? 'currentColor' : 'none'}
                aria-hidden
              />
              {favorite ? 'Favorita' : 'Favoritar'}
            </button>
            {isOwner && (
              <button type="button" onClick={onEdit} className={btn}>
                <Pencil className="size-4" aria-hidden />
                Editar
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button type="button" onClick={onDelete} className={btnDanger}>
                <Trash2 className="size-4" aria-hidden />
                {isOwner ? 'Apagar' : 'Apagar (admin)'}
              </button>
            )}
            {!isOwner && <ReportButton recipeId={r.id} />}
          </div>
        )}
      </div>
    </article>
  )
}
