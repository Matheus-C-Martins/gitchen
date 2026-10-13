import { ChefHat, Heart, Languages, LoaderCircle, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Recipe } from '../types'
import { dateLocale } from '../i18n'
import { useTranslatedRecipe } from '../lib/useTranslatedRecipe'
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
  const { t } = useTranslation()
  const tr = useTranslatedRecipe(r)
  const isOwner = userId === r.user_id
  const loggedIn = userId !== undefined
  const shown =
    tr.result && tr.showTranslation
      ? tr.result
      : { title: r.title, ingredients: r.ingredients, steps: r.steps }
  const steps = shown.steps
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const date = new Date(r.created_at).toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const working = tr.status === 'working'
  const percent = tr.progress === null ? null : Math.round(tr.progress * 100)
  const statusText =
    working && percent !== null && percent < 100
      ? t('translate.downloading', { percent })
      : tr.result && tr.showTranslation
        ? t('translate.notice')
        : null

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
      <RecipePhoto
        path={r.photo_path}
        alt={shown.title}
        className="aspect-[16/10] max-h-[26rem] w-full sm:aspect-[16/8]"
      />

      <div className="p-5 sm:p-10">
        <header className="text-center">
          {r.tag_names.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {r.tag_names.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onTagClick(name)}
                  className={`${tagPill} min-h-8 px-3 text-sm transition hover:brightness-95`}
                >
                  #{name}
                </button>
              ))}
            </div>
          )}
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {shown.title}
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
              {t('recipe.by', {
                name: r.profiles?.username ?? t('recipe.unknown'),
              })}
            </span>
            <span aria-hidden>·</span>
            <time dateTime={r.created_at}>{date}</time>
          </p>

          {tr.available && (
            <div className="mt-4 flex flex-col items-center gap-2">
              {tr.result ? (
                <button
                  type="button"
                  onClick={() => tr.setShowTranslation(!tr.showTranslation)}
                  className={btn}
                >
                  <Languages className="size-4" aria-hidden />
                  {tr.showTranslation
                    ? t('translate.showOriginal')
                    : t('translate.showTranslation')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void tr.run()}
                  disabled={working}
                  className={btn}
                >
                  {working ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Languages className="size-4" aria-hidden />
                  )}
                  {working ? t('translate.working') : t('translate.button')}
                </button>
              )}
              {statusText && (
                <p role="status" className="text-xs text-muted">
                  {statusText}
                </p>
              )}
              {tr.errorKey && (
                <p role="alert" className="text-xs text-danger">
                  {t(tr.errorKey)}
                </p>
              )}
            </div>
          )}
        </header>

        <div className="ornament my-8" aria-hidden>
          <ChefHat className="size-5" />
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
          <section aria-labelledby="ingredients">
            <h2 id="ingredients" className="font-serif text-2xl font-semibold">
              {t('recipe.ingredients')}
            </h2>
            {shown.ingredients.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {shown.ingredients.map((i, idx) => (
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
              <p className="mt-3 text-sm text-muted">
                {t('recipe.noIngredients')}
              </p>
            )}
          </section>

          <section aria-labelledby="method">
            <h2 id="method" className="font-serif text-2xl font-semibold">
              {t('recipe.method')}
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
              <p className="mt-3 text-sm text-muted">{t('recipe.noMethod')}</p>
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
              {favorite ? t('recipe.favourited') : t('recipe.favourite')}
            </button>
            {isOwner && (
              <button type="button" onClick={onEdit} className={btn}>
                <Pencil className="size-4" aria-hidden />
                {t('recipe.edit')}
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button type="button" onClick={onDelete} className={btnDanger}>
                <Trash2 className="size-4" aria-hidden />
                {isOwner ? t('recipe.delete') : t('recipe.deleteAdmin')}
              </button>
            )}
            {!isOwner && <ReportButton recipeId={r.id} />}
          </div>
        )}
      </div>
    </article>
  )
}
