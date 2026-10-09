import type { Recipe } from '../types'
import { recipeHref } from '../lib/route'
import RecipePhoto from './RecipePhoto'
import ReportButton from './ReportButton'

interface Props {
  recipe: Recipe
  userId: string | undefined
  isAdmin: boolean
  asLink?: boolean
  onTagClick?: (tag: string) => void
  onEdit: () => void
  onDelete: () => void
}

const titleClass = 'font-semibold text-stone-900 dark:text-stone-50'

export default function RecipeView({
  recipe: r,
  userId,
  isAdmin,
  asLink,
  onTagClick,
  onEdit,
  onDelete,
}: Props) {
  const isOwner = userId === r.user_id
  const loggedIn = userId !== undefined
  return (
    <>
      {asLink ? (
        <h2 className={`text-xl ${titleClass}`}>
          <a
            href={recipeHref(r.id)}
            className="hover:text-orange-600 dark:hover:text-orange-400"
          >
            {r.title}
          </a>
        </h2>
      ) : (
        <h1 className={`text-3xl ${titleClass}`}>{r.title}</h1>
      )}
      <p className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
        {r.profiles?.avatar_url && (
          <img
            src={r.profiles.avatar_url}
            alt=""
            className="h-5 w-5 rounded-full"
          />
        )}
        <span>por {r.profiles?.username ?? 'desconhecido'}</span>
      </p>
      {r.tag_names.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.tag_names.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTagClick?.(t)}
              className="rounded-full bg-orange-100 px-3 py-0.5 text-sm text-orange-800 transition hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
      <RecipePhoto path={r.photo_path} alt={r.title} />
      {r.ingredients.length > 0 && (
        <ul className="list-inside list-disc text-stone-700 dark:text-stone-300">
          {r.ingredients.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      )}
      {r.steps && (
        <p className="whitespace-pre-wrap text-stone-600 dark:text-stone-400">
          {r.steps}
        </p>
      )}
      {loggedIn && (
        <div className="flex flex-wrap items-start gap-2">
          {isOwner && (
            <button
              onClick={onEdit}
              className="rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700"
            >
              Editar
            </button>
          )}
          {(isOwner || isAdmin) && (
            <button
              onClick={onDelete}
              className="rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-stone-600 dark:text-stone-300 dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              {isOwner ? 'Apagar' : 'Apagar (admin)'}
            </button>
          )}
          {!isOwner && <ReportButton recipeId={r.id} />}
        </div>
      )}
    </>
  )
}
