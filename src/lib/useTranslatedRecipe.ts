import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Recipe } from '../types'
import {
  TranslateError,
  canTranslate,
  translateRecipe,
  type TranslatableRecipe,
} from './translate'

type Status = 'idle' | 'working' | 'done'

export function useTranslatedRecipe(recipe: Recipe) {
  const { i18n } = useTranslation()
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<number | null>(null)
  const [result, setResult] = useState<TranslatableRecipe | null>(null)
  const [showTranslation, setShowTranslation] = useState(true)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const language = i18n.language
  const content = recipe.ingredients.join('\n')

  useEffect(() => {
    setStatus('idle')
    setProgress(null)
    setResult(null)
    setShowTranslation(true)
    setErrorKey(null)
  }, [recipe.id, recipe.title, recipe.steps, content, language])

  const run = useCallback(async () => {
    setStatus('working')
    setProgress(null)
    setErrorKey(null)
    try {
      const out = await translateRecipe(
        {
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
        },
        language,
        setProgress,
      )
      setResult(out)
      setShowTranslation(true)
      setStatus('done')
    } catch (err) {
      setStatus('idle')
      setErrorKey(
        err instanceof TranslateError
          ? `translate.${err.reason}`
          : 'translate.failed',
      )
    }
  }, [recipe.title, recipe.ingredients, recipe.steps, language])

  return {
    available: canTranslate(),
    status,
    progress,
    result,
    showTranslation,
    setShowTranslation,
    errorKey,
    run,
  }
}
