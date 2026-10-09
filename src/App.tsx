import { useEffect, useState, type FormEvent } from 'react'
import type { Recipe } from './types'

const STORAGE_KEY = 'gitchen:recipes'

function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Recipe[]) : []
  } catch {
    return []
  }
}

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes)
  const [title, setTitle] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes])

  const addRecipe = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      title: title.trim(),
      ingredients: ingredients.split('\n').map((i) => i.trim()).filter(Boolean),
      steps: steps.trim(),
    }
    setRecipes((prev) => [recipe, ...prev])
    setTitle('')
    setIngredients('')
    setSteps('')
  }

  const removeRecipe = (id: string) =>
    setRecipes((prev) => prev.filter((r) => r.id !== id))

  const q = query.toLowerCase()
  const visible = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.ingredients.some((i) => i.toLowerCase().includes(q)),
  )

  return (
    <main className="container">
      <h1>🍳 Gitchen</h1>
      <p className="subtitle">O teu livro de receitas</p>

      <form onSubmit={addRecipe} className="card">
        <input
          placeholder="Título da receita"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Ingredientes (um por linha)"
          rows={4}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
        <textarea
          placeholder="Modo de preparação"
          rows={4}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
        />
        <button type="submit">Adicionar receita</button>
      </form>

      <input
        className="search"
        placeholder="Pesquisar por título ou ingrediente"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {visible.length === 0 && <p>Sem receitas para mostrar.</p>}
      {visible.map((r) => (
        <article key={r.id} className="card">
          <h2>{r.title}</h2>
          {r.ingredients.length > 0 && (
            <ul>
              {r.ingredients.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          )}
          <p className="steps">{r.steps}</p>
          <button className="danger" onClick={() => removeRecipe(r.id)}>
            Remover
          </button>
        </article>
      ))}
    </main>
  )
}
