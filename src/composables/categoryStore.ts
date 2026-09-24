import { categories as seedCategoriesData } from '~/data/news'
import { STORAGE_PREFIX } from '~/utils/constants'
import { genId } from '~/utils/hash'
import { avatarPalettes } from '~/utils/palettes'

export interface CategoryRecord {
  id: string
  label: string
  color: [string, string]
  locked: boolean
  createdAt: number
}

export type CategoryDraft = Omit<CategoryRecord, 'id' | 'locked' | 'createdAt'>

const KEY = `${STORAGE_PREFIX}categories`

const seedPalette: Record<string, [string, string]> = {
  all: ['#F97316', '#EC4899'],
  domestic: ['#4F46E5', '#7C3AED'],
  entertainment: ['#EC4899', '#8B5CF6'],
  finance: ['#14B8A6', '#3B82F6'],
  sports: ['#F59E0B', '#EF4444'],
  tech: ['#10B981', '#0EA5E9'],
  world: ['#0EA5E9', '#6366F1'],
}

function seedCategories(): CategoryRecord[] {
  const now = Date.now()
  return seedCategoriesData.map((category, i) => ({
    color: seedPalette[category.id] ?? avatarPalettes[i % avatarPalettes.length],
    createdAt: now - (seedCategoriesData.length - i) * 3_600_000,
    id: category.id,
    label: category.label,
    locked: category.id === 'all',
  }))
}

export const categoryList = useLocalStorage<CategoryRecord[]>(KEY, seedCategories, { shallow: true })

export const categoryById = computed(() => new Map(categoryList.value.map((c) => [c.id, c])))

export function useCategoryStore() {
  const total = computed(() => categoryList.value.length)
  const recommendCategory = computed(() => categoryList.value.find((c) => c.id === 'all'))
  const newsCategories = computed(() => categoryList.value.filter((c) => c.id !== 'all'))

  function getCategoryById(id: string) {
    return categoryList.value.find((c) => c.id === id)
  }

  function createCategory(draft: CategoryDraft) {
    const record: CategoryRecord = {
      ...draft,
      createdAt: Date.now(),
      id: genId('cat'),
      locked: false,
    }
    categoryList.value = [...categoryList.value, record]
    return record
  }

  function updateCategory(id: string, patch: Partial<CategoryDraft>) {
    categoryList.value = categoryList.value.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c))
  }

  function removeCategory(id: string) {
    categoryList.value = categoryList.value.filter((c) => c.id !== id)
  }

  function resetCategories() {
    categoryList.value = seedCategories()
  }

  return {
    categoryById,
    createCategory,
    getCategoryById,
    list: categoryList,
    newsCategories,
    recommendCategory,
    removeCategory,
    resetCategories,
    total,
    updateCategory,
  }
}
