import { allNews } from '~/data/news'
import { STORAGE_PREFIX } from '~/utils/constants'
import { genId } from '~/utils/hash'

export type NewsStatus = 'published' | 'draft'

export interface NewsRecord {
  id: string
  title: string
  category: string
  source: string
  time: string
  tag: string
  reads: string
  summary: string
  content: string
  gradient: [string, string]
  status: NewsStatus
  pinned: boolean
  scheduledAt?: number
  deletedAt?: number
  createdAt: number
  updatedAt: number
}

export type NewsDraft = Omit<NewsRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

const KEY = `${STORAGE_PREFIX}news`

function seedNews(): NewsRecord[] {
  const now = Date.now()
  return allNews.map((item, i) => ({
    ...item,
    createdAt: now - (allNews.length - i) * 3_600_000,
    pinned: i === 0,
    status: i % 6 === 5 ? 'draft' : 'published',
    updatedAt: now - (allNews.length - i) * 3_600_000,
  }))
}

export const newsList = useLocalStorage<NewsRecord[]>(KEY, seedNews, { shallow: true })

export function useNewsStore() {
  const total = computed(() => newsList.value.filter((n) => n.deletedAt === undefined).length)
  const publishedCount = computed(
    () => newsList.value.filter((n) => n.status === 'published' && n.deletedAt === undefined).length,
  )
  const draftCount = computed(
    () => newsList.value.filter((n) => n.status === 'draft' && n.deletedAt === undefined).length,
  )
  const pinnedCount = computed(() => newsList.value.filter((n) => n.pinned && n.deletedAt === undefined).length)

  function sortedNews() {
    return newsList.value.filter((n) => n.deletedAt === undefined).sort((a, b) => b.createdAt - a.createdAt)
  }

  function getNewsById(id: string) {
    return newsList.value.find((n) => n.id === id)
  }

  function createNews(draft: NewsDraft) {
    const now = Date.now()
    const record: NewsRecord = { ...draft, createdAt: now, id: genId('n'), updatedAt: now }
    newsList.value = [record, ...newsList.value]
    return record
  }

  function updateNews(id: string, draft: NewsDraft) {
    newsList.value = newsList.value.map((n) => (n.id === id ? { ...n, ...draft, id, updatedAt: Date.now() } : n))
  }

  function removeNews(id: string) {
    newsList.value = newsList.value.filter((n) => n.id !== id)
  }

  function softDeleteNews(id: string) {
    const now = Date.now()
    newsList.value = newsList.value.map((n) => (n.id === id ? { ...n, deletedAt: now, updatedAt: now } : n))
  }

  function bulkSoftDeleteNews(ids: Iterable<string>) {
    const set = new Set(ids)
    const now = Date.now()
    newsList.value = newsList.value.map((n) => (set.has(n.id) ? { ...n, deletedAt: now, updatedAt: now } : n))
  }

  function restoreNews(id: string) {
    newsList.value = newsList.value.map((n) =>
      n.id === id ? { ...n, deletedAt: undefined, updatedAt: Date.now() } : n,
    )
  }

  function bulkRestoreNews(ids: Iterable<string>) {
    const set = new Set(ids)
    const now = Date.now()
    newsList.value = newsList.value.map((n) => (set.has(n.id) ? { ...n, deletedAt: undefined, updatedAt: now } : n))
  }

  function emptyTrash() {
    newsList.value = newsList.value.filter((n) => n.deletedAt === undefined)
  }

  const trashedNews = computed(() => newsList.value.filter((n) => n.deletedAt !== undefined))
  const trashCount = computed(() => trashedNews.value.length)

  function bulkRemoveNews(ids: Iterable<string>) {
    const set = new Set(ids)
    newsList.value = newsList.value.filter((n) => !set.has(n.id))
  }

  function bulkSetNewsStatus(ids: Iterable<string>, status: NewsStatus) {
    const set = new Set(ids)
    const now = Date.now()
    newsList.value = newsList.value.map((n) => (set.has(n.id) ? { ...n, status, updatedAt: now } : n))
  }

  function togglePinned(id: string) {
    newsList.value = newsList.value.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
  }

  function cloneNews(id: string, title?: string) {
    const source = getNewsById(id)
    if (!source) return
    const now = Date.now()
    const record: NewsRecord = {
      ...source,
      createdAt: now,
      id: genId('n'),
      pinned: false,
      scheduledAt: undefined,
      status: 'draft',
      title: title ?? source.title,
      updatedAt: now,
    }
    newsList.value = [record, ...newsList.value]
    return record
  }

  function publishDueNews() {
    const now = Date.now()
    const due = newsList.value.filter((n) => n.scheduledAt && n.scheduledAt <= now && n.status !== 'published')
    if (!due.length) return
    const ids = new Set(due.map((n) => n.id))
    newsList.value = newsList.value.map((n) =>
      ids.has(n.id) ? { ...n, scheduledAt: undefined, status: 'published', updatedAt: now } : n,
    )
    return due.length
  }

  function resetNews() {
    newsList.value = seedNews()
  }

  return {
    bulkRemoveNews,
    bulkRestoreNews,
    bulkSetNewsStatus,
    bulkSoftDeleteNews,
    cloneNews,
    createNews,
    draftCount,
    emptyTrash,
    getNewsById,
    list: newsList,
    pinnedCount,
    publishDueNews,
    publishedCount,
    removeNews,
    resetNews,
    restoreNews,
    softDeleteNews,
    sortedNews,
    togglePinned,
    total,
    trashCount,
    trashedNews,
    updateNews,
  }
}
