import type { NewsDraft } from '../src/composables/newsStore'
import { afterEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useCategoryStore } from '../src/composables/categoryStore'
import { useCommentStore } from '../src/composables/commentStore'
import { useNewsStore } from '../src/composables/newsStore'
import { usePagination } from '../src/composables/usePagination'
import { useUserStore } from '../src/composables/userStore'

const news = useNewsStore()
const categories = useCategoryStore()
const comments = useCommentStore()
const users = useUserStore()

afterEach(() => {
  news.resetNews()
  categories.resetCategories()
  comments.resetComments()
  users.resetUsers()
})

const draft: NewsDraft = {
  category: 'tech',
  content: '正文',
  gradient: ['#4F46E5', '#7C3AED'],
  pinned: false,
  reads: '100',
  source: '测试源',
  status: 'published',
  summary: '摘要',
  tag: '测试',
  time: '10:00',
  title: '测试新闻',
}

describe('newsStore', () => {
  it('seeds from mock data', () => {
    expect(news.total.value).toBeGreaterThan(0)
    expect(news.publishedCount.value + news.draftCount.value).toBe(news.total.value)
  })

  it('creates a news item', () => {
    const before = news.total.value
    const record = news.createNews(draft)
    expect(news.total.value).toBe(before + 1)
    expect(news.getNewsById(record.id)).toMatchObject({ title: '测试新闻' })
  })

  it('updates a news item', () => {
    const id = news.list.value[0].id
    news.updateNews(id, { ...draft, title: '更新后的标题' })
    expect(news.getNewsById(id)?.title).toBe('更新后的标题')
  })

  it('removes a news item', () => {
    const before = news.total.value
    news.removeNews(news.list.value[0].id)
    expect(news.total.value).toBe(before - 1)
  })

  it('toggles pinned state', () => {
    const id = news.list.value[0].id
    const first = news.getNewsById(id)?.pinned
    news.togglePinned(id)
    expect(news.getNewsById(id)?.pinned).toBe(!first)
  })

  it('bulk sets status and removes news in batch', () => {
    const ids = news.list.value.slice(0, 2).map((n) => n.id)
    news.bulkSetNewsStatus(ids, 'draft')
    expect(news.list.value.filter((n) => ids.includes(n.id)).every((n) => n.status === 'draft')).toBe(true)
    const before = news.total.value
    news.bulkRemoveNews(ids)
    expect(news.total.value).toBe(before - 2)
  })
})

describe('categoryStore', () => {
  it('seeds default categories and locks the recommend one', () => {
    expect(categories.total.value).toBeGreaterThan(0)
    expect(categories.recommendCategory.value?.locked).toBe(true)
  })

  it('creates and removes a category', () => {
    const before = categories.total.value
    const record = categories.createCategory({ color: ['#111111', '#222222'], label: '教育' })
    expect(categories.total.value).toBe(before + 1)
    expect(categories.getCategoryById(record.id)?.label).toBe('教育')
    categories.removeCategory(record.id)
    expect(categories.getCategoryById(record.id)).toBeUndefined()
  })

  it('updates a category without changing the id', () => {
    const record = categories.createCategory({ color: ['#111111', '#222222'], label: '健康' })
    categories.updateCategory(record.id, { label: '养生' })
    const updated = categories.getCategoryById(record.id)
    expect(updated?.label).toBe('养生')
    expect(updated?.id).toBe(record.id)
  })
})

describe('commentStore', () => {
  it('seeds comments for every news item', () => {
    expect(comments.total.value).toBeGreaterThan(0)
    expect(comments.hiddenCount.value).toBe(0)
  })

  it('hides and restores a comment', () => {
    const id = comments.list.value[0].id
    comments.setCommentStatus(id, 'hidden')
    expect(comments.list.value.find((c) => c.id === id)?.status).toBe('hidden')
    expect(comments.hiddenCount.value).toBe(1)
    comments.toggleCommentStatus(id)
    expect(comments.list.value.find((c) => c.id === id)?.status).toBe('normal')
  })

  it('removes one comment or all for a news', () => {
    const newsId = comments.list.value[0].newsId
    const before = comments.total.value
    comments.removeComment(comments.list.value[0].id)
    expect(comments.total.value).toBe(before - 1)
    const remaining = comments.list.value.filter((c) => c.newsId === newsId).length
    comments.removeCommentsByNews(newsId)
    expect(comments.list.value.filter((c) => c.newsId === newsId)).toHaveLength(0)
    expect(comments.total.value).toBe(before - 1 - remaining)
  })

  it('bulk hides and deletes comments', () => {
    const ids = comments.list.value.slice(0, 2).map((c) => c.id)
    comments.bulkSetCommentStatus(ids, 'hidden')
    expect(comments.hiddenCount.value).toBe(2)
    const before = comments.total.value
    comments.bulkRemoveComments(ids)
    expect(comments.total.value).toBe(before - 2)
  })
})

describe('userStore', () => {
  it('seeds mock users with consistent states', () => {
    expect(users.total.value).toBeGreaterThan(0)
    expect(users.activeCount.value + users.bannedCount.value).toBe(users.total.value)
    expect(users.adminCount.value).toBeGreaterThan(0)
  })

  it('creates and updates a user', () => {
    const before = users.total.value
    const record = users.createUser({
      avatar: ['#111111', '#222222'],
      bio: '',
      followers: 0,
      following: 0,
      likes: 0,
      posts: 0,
      role: 'user',
      status: 'active',
      username: '新用户',
    })
    expect(users.total.value).toBe(before + 1)
    users.updateUser(record.id, { role: 'editor' })
    expect(users.getUserById(record.id)?.role).toBe('editor')
  })

  it('bans, reactivates and deletes a user', () => {
    const id = users.list.value[0].id
    users.toggleUserStatus(id)
    expect(users.getUserById(id)?.status).toBe('banned')
    users.toggleUserStatus(id)
    expect(users.getUserById(id)?.status).toBe('active')
    users.removeUser(id)
    expect(users.getUserById(id)).toBeUndefined()
  })

  it('bulk bans and deletes users', () => {
    const ids = users.list.value.slice(0, 2).map((u) => u.id)
    users.bulkSetUserStatus(ids, 'banned')
    expect(users.bannedCount.value).toBeGreaterThanOrEqual(2)
    const before = users.total.value
    users.bulkRemoveUsers(ids)
    expect(users.total.value).toBe(before - 2)
  })
})

describe('usePagination', () => {
  it('slices pages and clamps the page range', () => {
    const source = ref(Array.from({ length: 25 }, (_, i) => i))
    const { page, pageItems, setPage, total, totalPages } = usePagination(source, 10)
    expect(total.value).toBe(25)
    expect(totalPages.value).toBe(3)
    expect(pageItems.value).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    setPage(2)
    expect(pageItems.value).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    setPage(99)
    expect(page.value).toBe(3)
    setPage(-5)
    expect(page.value).toBe(1)
  })

  it('resets to the first page when the source shrinks', () => {
    const source = ref(Array.from({ length: 20 }, (_, i) => i))
    const { page, setPage, total } = usePagination(source, 10)
    setPage(2)
    expect(page.value).toBe(2)
    source.value = [0, 1, 2]
    expect(total.value).toBe(3)
    expect(page.value).toBe(1)
  })
})
