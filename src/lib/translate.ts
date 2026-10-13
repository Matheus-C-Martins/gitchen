export interface TranslatableRecipe {
  title: string
  ingredients: string[]
  steps: string
}

type TranslationFailure =
  | 'unsupported'
  | 'sameLanguage'
  | 'pairUnavailable'
  | 'failed'

export class TranslateError extends Error {
  reason: TranslationFailure

  constructor(reason: TranslationFailure) {
    super(reason)
    this.reason = reason
  }
}

interface TranslatorLike {
  translate(input: string): Promise<string>
  destroy?: () => void
}

interface TranslatorStatic {
  availability(options: {
    sourceLanguage: string
    targetLanguage: string
  }): Promise<string>
  create(options: {
    sourceLanguage: string
    targetLanguage: string
    monitor?: (monitor: EventTarget) => void
  }): Promise<TranslatorLike>
}

interface DetectorLike {
  detect(
    input: string,
  ): Promise<{ detectedLanguage: string; confidence: number }[]>
}

interface DetectorStatic {
  create(): Promise<DetectorLike>
}

const browserAi = globalThis as unknown as {
  Translator?: TranslatorStatic
  LanguageDetector?: DetectorStatic
}

export function canTranslate(): boolean {
  return browserAi.Translator !== undefined
}

async function detectSource(text: string, fallback: string): Promise<string> {
  const Detector = browserAi.LanguageDetector
  if (!Detector) return fallback
  try {
    const detector = await Detector.create()
    const [top] = await detector.detect(text)
    if (!top || top.confidence < 0.5) return fallback
    const code = top.detectedLanguage.split('-')[0]
    return code && code !== 'und' ? code : fallback
  } catch {
    return fallback
  }
}

export async function translateRecipe(
  recipe: TranslatableRecipe,
  target: string,
  onProgress?: (fraction: number) => void,
): Promise<TranslatableRecipe> {
  const Translator = browserAi.Translator
  if (!Translator) throw new TranslateError('unsupported')

  const sample = [recipe.title, ...recipe.ingredients, recipe.steps].join('\n')
  const source = await detectSource(sample, target === 'pt' ? 'en' : 'pt')
  if (source === target) throw new TranslateError('sameLanguage')

  const pair = { sourceLanguage: source, targetLanguage: target }
  const availability = await Translator.availability(pair)
  if (availability === 'unavailable') throw new TranslateError('pairUnavailable')

  const translator = await Translator.create({
    ...pair,
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (event) => {
        onProgress?.((event as ProgressEvent).loaded)
      })
    },
  })

  const translateLines = async (text: string): Promise<string> => {
    const out: string[] = []
    for (const line of text.split('\n')) {
      out.push(line.trim() ? await translator.translate(line) : line)
    }
    return out.join('\n')
  }

  try {
    const title = await translator.translate(recipe.title)
    const ingredients: string[] = []
    for (const line of recipe.ingredients) {
      ingredients.push(await translator.translate(line))
    }
    const steps = await translateLines(recipe.steps)
    return { title, ingredients, steps }
  } finally {
    translator.destroy?.()
  }
}
