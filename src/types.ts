export interface Author {
  username: string
  avatar_url: string | null
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  ingredients: string[]
  steps: string
  photo_path: string | null
  tag_names: string[]
  created_at: string
  profiles: Author | null
}

export interface RecipeInput {
  title: string
  ingredients: string[]
  steps: string
  photo_path: string | null
}
