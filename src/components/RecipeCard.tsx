import { Heart, ListChecks } from 'lucide-react'
import type { Recipe } from '../types'
import { recipeHref } from '../lib/route'
import { tagPill } from '../lib/ui'
import RecipePhoto from './RecipePhoto'

interface Props {
  recipe: Recipe
  favorite: boolean
  loggedIn: boolean
  onToggleFavorite: () => void
  onTagClick: (tag: string) => void
}

export default function RecipeCard({
  recipe: r,
  favorite,
  loggedIn,
  onToggleFavorite,
  onTagClick,
}: Props) {
  const count = r.ingredients.length
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="overflow-hidden">
        <RecipePhoto
          path={r.photo_path}
          alt=""
          fallback
          className="aspect-[4/3] w-full transition duration-300 group-hover:scale-[1.03]"
        />
      </div>

      {loggedIn && (
        <button
          type="button"
          aria-pressed={favorite}
          aria-label={
            favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
          }
          title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          onClick={onToggleFavorite}
          className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-card/90 text-accent shadow backdrop-blur transition hover:scale-105 active:scale-95 sm:size-10"
        >
          <Heart
            className="size-5"
            fill={favorite ? 'currentColor' : 'none'}
            aria-hidden
          />
        </button>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-serif text-xl font-semibold leading-snug">
          <a
            href={recipeHref(r.id)}
            className="after:absolute after:inset-0 hover:text-accent"
          >
            {r.title}
          </a>
        </h3>

        {r.tag_names.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {r.tag_names.slice(0, 3).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTagClick(t)}
                className={`${tagPill} relative z-10 transition hover:brightness-95`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-sm text-muted">
          <span className="flex min-w-0 items-center gap-2">
            {r.profiles?.avatar_url && (
              <img
                src={r.profiles.avatar_url}
                alt=""
                className="size-5 shrink-0 rounded-full"
              />
            )}
            <span className="truncate">{r.profiles?.username ?? 'desconhecido'}</span>
          </span>
          <span
            className="inline-flex shrink-0 items-center gap-1"
            title={`${count} ingredientes`}
          >
            <ListChecks className="size-4" aria-hidden />
            {count}
          </span>
        </div>
      </div>
    </article>
  )
}
