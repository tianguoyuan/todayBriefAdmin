<script setup lang="ts">
  import { useToast } from '~/composables'
  import { exportXlsx } from '~/utils/exportXlsx'

  interface NewsRecord {
    id: string
    title: string
    category: string
    status: 'published' | 'draft'
    pinned: boolean
    reads: string
    time: string
    source: string
    tag?: string
    summary: string
    gradient: [string, string]
    createdAt: number
  }

  interface CommentRecord {
    id: string
    username: string
    content: string
    newsId: string
    status: 'normal' | 'hidden'
    time: string
    likes: number
  }

  interface UserRecord {
    id: string
    username: string
    role: 'admin' | 'editor' | 'user'
    status: 'active' | 'banned'
    bio: string
    followers: number
    following: number
    joinedAt: string
  }

  const props = defineProps<{
    newsList: NewsRecord[]
    commentsList: CommentRecord[]
    usersList: UserRecord[]
    categories: { newsCategories: Array<{ id: string; label: string }> }
  }>()

  const { show: showTip } = useToast()

  function exportAll() {
    const categoryLabel = (id: string) => props.categories.newsCategories.find((c) => c.id === id)?.label ?? id
    const newsById = new Map(props.newsList.map((item) => [item.id, item]))

    const newsRows = props.newsList.map((item) => [
      item.title,
      categoryLabel(item.category),
      item.status === 'published' ? '已发布' : '草稿',
      item.pinned ? '是' : '否',
      item.reads,
      item.time,
      item.source,
      item.tag ?? '',
      item.summary,
    ])
    exportXlsx(
      `仪表盘-新闻-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['标题', '分类', '状态', '置顶', '阅读', '时间', '来源', '标签', '摘要'],
      newsRows,
      '新闻',
    )

    const commentRows = props.commentsList.map((comment) => [
      comment.username,
      comment.content.replaceAll('\n', ' '),
      newsById.get(comment.newsId)?.title ?? '',
      comment.status === 'hidden' ? '已隐藏' : '正常',
      comment.time,
      comment.likes,
    ])
    exportXlsx(
      `仪表盘-评论-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['用户', '内容', '所属新闻', '状态', '时间', '点赞'],
      commentRows,
      '评论',
    )

    const userRows = props.usersList.map((user) => [
      user.username,
      user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑' : '用户',
      user.status === 'active' ? '正常' : '已禁用',
      user.bio,
      user.followers,
      user.following,
      user.joinedAt,
    ])
    exportXlsx(
      `仪表盘-用户-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['用户名', '角色', '状态', '简介', '粉丝', '关注', '加入时间'],
      userRows,
      '用户',
    )

    showTip('已导出新闻、评论、用户三份 Excel')
  }
</script>

<template>
  <div class="flex flex-wrap gap-2 justify-end">
    <button class="btn-ghost text-xs" type="button" @click="exportAll">
      <div class="i-carbon-download" />
      导出新闻 / 评论 / 用户 Excel
    </button>
  </div>
</template>

<style scoped></style>
