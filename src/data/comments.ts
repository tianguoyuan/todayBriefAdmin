import { avatarPalettes } from '~/utils/palettes'

export interface Comment {
  id: string
  username: string
  avatar: [string, string]
  time: string
  content: string
  likes: number
  replies: Comment[]
  /** 2 级回复：被回复的评论作者 */
  replyTo?: string
}

const usernames = [
  '清风徐来',
  '数码玩家',
  '环球观察者',
  '街头摄影师',
  '咖啡不加糖',
  '山间明月',
  '快乐星球居民',
  '深夜电台',
  '骑单车看世界',
  '凌晨四点的海',
]

const contents = [
  '这篇文章信息量很大，看完又涨知识了，感谢小编整理。',
  '希望后续能有更深入的分析，感觉还有很多细节没展开。',
  '评论区先蹲一个专业解读，这个领域水深得很。',
  '跟我的观点基本一致，最近也明显感受到了这个趋势。',
  '理性讨论哈，个人觉得还需要观察一段时间再下结论。',
  '转发给朋友了，这类内容太实用了。',
  '数据来源准确吗？有点想求证一下最新口径。',
  '说得有道理，不过部分地区的情况可能不太一样。',
]

const replyContents = [
  '同意，期待后续更新。',
  '补充一点：官方渠道今天也发了相关说明。',
  '说得太对了，支持！',
  '可以看看隔壁那篇，讲得更细。',
  '匿名区有个帖子也在讨论这个。',
]

const times = ['5分钟前', '23分钟前', '1小时前', '2小时前', '昨天 21:00', '昨天 14:30', '前天 09:12']

function hashKeys(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function mockUser(seed: number, offset: number) {
  return {
    avatar: avatarPalettes[(seed + offset) % avatarPalettes.length],
    username: usernames[(seed + offset) % usernames.length],
  }
}

export function getComments(newsId: string): Comment[] {
  const seed = hashKeys(newsId)
  const count = 3 + (seed % 3)
  const list: Comment[] = []

  for (let i = 0; i < count; i++) {
    const replies: Comment[] = []
    const replyCount = i % 3 === 0 ? 1 + (i % 2) : 0
    for (let r = 0; r < replyCount; r++) {
      const replySeed = seed + i * 7 + r * 13
      const author = mockUser(replySeed, 3)
      replies.push({
        avatar: author.avatar,
        content: replyContents[(replySeed + r) % replyContents.length],
        id: `${newsId}-c${i}-r${r}`,
        likes: 5 + ((replySeed * (r + 1)) % 245),
        replies: [],
        time: times[(seed + i + r) % times.length],
        username: author.username,
      })
    }
    const author = mockUser(seed, i)
    const commentSeed = seed * (i + 5)
    list.push({
      avatar: author.avatar,
      content: contents[commentSeed % contents.length],
      id: `${newsId}-c${i}`,
      likes: 18 + (commentSeed % 980),
      replies,
      time: times[(seed + i * 3) % times.length],
      username: author.username,
    })
  }

  return list
}
