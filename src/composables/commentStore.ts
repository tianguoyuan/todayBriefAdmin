import { getComments } from '~/data/comments'
import { allNews } from '~/data/news'
import { STORAGE_PREFIX } from '~/utils/constants'

export type CommentStatus = 'normal' | 'hidden'

export interface CommentRecord {
  id: string
  newsId: string
  username: string
  avatar: [string, string]
  time: string
  content: string
  likes: number
  parentId?: string
  replyTo?: string
  status: CommentStatus
  read: boolean
  createdAt: number
}

const KEY = `${STORAGE_PREFIX}comments`

function seedComments(): CommentRecord[] {
  const base = Date.now()
  const records: CommentRecord[] = []
  allNews.forEach((news, ni) => {
    const offset = (allNews.length - ni) * 3_600_000
    const comments = getComments(news.id)
    comments.forEach((comment, ci) => {
      records.push({
        avatar: comment.avatar,
        content: comment.content,
        createdAt: base - offset + ci * 60_000,
        id: comment.id,
        likes: comment.likes,
        newsId: news.id,
        read: ci % 3 !== 0,
        status: 'normal',
        time: comment.time,
        username: comment.username,
      })
      comment.replies?.forEach((reply, ri) => {
        records.push({
          avatar: reply.avatar,
          content: reply.content,
          createdAt: base - offset + ci * 60_000 + (ri + 1) * 30_000,
          id: reply.id,
          likes: reply.likes,
          newsId: news.id,
          parentId: comment.id,
          read: false,
          replyTo: comment.username,
          status: 'normal',
          time: reply.time,
          username: reply.username,
        })
      })
    })
  })
  return records
}

export const commentList = useLocalStorage<CommentRecord[]>(KEY, seedComments, { shallow: true })

export function useCommentStore() {
  const total = computed(() => commentList.value.length)
  const hiddenCount = computed(() => commentList.value.filter((c) => c.status === 'hidden').length)
  const normalCount = computed(() => commentList.value.length - hiddenCount.value)
  const unreadCount = computed(() => commentList.value.filter((c) => !c.read).length)
  const totalLikes = computed(() => commentList.value.reduce((sum, c) => sum + c.likes, 0))

  function sortedComments() {
    return [...commentList.value].sort((a, b) => (a.read === b.read ? b.createdAt - a.createdAt : a.read ? 1 : -1))
  }

  function markCommentRead(id: string, read = true) {
    commentList.value = commentList.value.map((c) => (c.id === id ? { ...c, read } : c))
  }

  function bulkMarkCommentsRead(ids: Iterable<string>, read = true) {
    const set = new Set(ids)
    commentList.value = commentList.value.map((c) => (set.has(c.id) ? { ...c, read } : c))
  }

  function markAllCommentsRead() {
    commentList.value = commentList.value.map((c) => ({ ...c, read: true }))
  }

  function setCommentStatus(id: string, status: CommentStatus) {
    commentList.value = commentList.value.map((c) => (c.id === id ? { ...c, status } : c))
  }

  function toggleCommentStatus(id: string) {
    commentList.value = commentList.value.map((c) =>
      c.id === id ? { ...c, status: c.status === 'hidden' ? 'normal' : 'hidden' } : c,
    )
  }

  function removeComment(id: string) {
    commentList.value = commentList.value.filter((c) => c.id !== id)
  }

  function bulkRemoveComments(ids: Iterable<string>) {
    const set = new Set(ids)
    commentList.value = commentList.value.filter((c) => !set.has(c.id))
  }

  function bulkSetCommentStatus(ids: Iterable<string>, status: CommentStatus) {
    const set = new Set(ids)
    commentList.value = commentList.value.map((c) => (set.has(c.id) ? { ...c, status } : c))
  }

  function removeCommentsByNews(newsId: string) {
    commentList.value = commentList.value.filter((c) => c.newsId !== newsId)
  }

  function resetComments() {
    commentList.value = seedComments()
  }

  return {
    bulkMarkCommentsRead,
    bulkRemoveComments,
    bulkSetCommentStatus,
    hiddenCount,
    list: commentList,
    markAllCommentsRead,
    markCommentRead,
    normalCount,
    removeComment,
    removeCommentsByNews,
    resetComments,
    setCommentStatus,
    sortedComments,
    toggleCommentStatus,
    total,
    totalLikes,
    unreadCount,
  }
}
