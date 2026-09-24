import { STORAGE_PREFIX } from '~/utils/constants'
import { genId } from '~/utils/hash'
import { avatarPalettes } from '~/utils/palettes'

export type UserRole = 'admin' | 'editor' | 'user'
export type UserStatus = 'active' | 'banned'

export interface UserRecord {
  id: string
  username: string
  avatar: [string, string]
  bio: string
  followers: number
  following: number
  posts: number
  likes: number
  role: UserRole
  status: UserStatus
  joinedAt: string
}

export type UserDraft = Omit<UserRecord, 'id' | 'joinedAt'>

const KEY = `${STORAGE_PREFIX}users`

const days = 3_600_000 * 24

function seedUsers(): UserRecord[] {
  const base = Date.now()
  const names = [
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
    '星河入梦',
    '小镇做题家',
    '番茄炒蛋',
    '北岛在南',
  ]
  const bios = [
    '热爱生活，记录美好瞬间',
    '科技数码发烧友，专注新品评测',
    '走遍世界，用脚步丈量地球',
    '摄影是第二语言，取景器里看世界',
    '喜欢清闲，常驻图书馆与咖啡馆',
    '山不见我，我自去见山',
    '做一个快乐的打工人',
    '深夜电台常客，偶尔发发牢骚',
    '两轮丈量城市，骑行记录旅程',
    '凌晨四点的海，安静又辽阔',
    '追剧、追星、追梦',
    '做题家不认命，向上生长',
    '人间烟火气，最抚凡人心',
    '一半是山川湖海，一半是人间烟火',
  ]
  const roles: UserRole[] = [
    'admin',
    'editor',
    'user',
    'user',
    'user',
    'editor',
    'user',
    'user',
    'user',
    'user',
    'user',
    'editor',
    'user',
    'user',
  ]
  const banned: [number, string] = [7, '2024-04-02']

  return names.map((name, i) => {
    const isBanned = banned[0] === i
    const joinedDays = (i % 5) + 12 + i * 3
    const followers = ((i + 1) * 187) % 13000
    return {
      avatar: avatarPalettes[i % avatarPalettes.length],
      bio: bios[i],
      followers,
      following: (i * 53) % 900,
      id: `u${String(i + 1).padStart(2, '0')}`,
      joinedAt: new Date(base - joinedDays * days).toISOString().slice(0, 10),
      likes: ((i + 1) * 733) % 9000,
      posts: 12 + ((i * 37) % 180),
      role: roles[i],
      status: isBanned ? 'banned' : 'active',
      username: name,
    }
  })
}

export const userList = useLocalStorage<UserRecord[]>(KEY, seedUsers, { shallow: true })

export function useUserStore() {
  const total = computed(() => userList.value.length)
  const activeCount = computed(() => userList.value.filter((u) => u.status === 'active').length)
  const bannedCount = computed(() => userList.value.length - activeCount.value)
  const adminCount = computed(() => userList.value.filter((u) => u.role === 'admin').length)
  const totalFollowers = computed(() => userList.value.reduce((sum, u) => sum + u.followers, 0))

  function getUserById(id: string) {
    return userList.value.find((u) => u.id === id)
  }

  function createUser(draft: UserDraft) {
    const record: UserRecord = {
      ...draft,
      id: genId('u'),
      joinedAt: new Date().toISOString().slice(0, 10),
    }
    userList.value = [...userList.value, record]
    return record
  }

  function updateUser(id: string, patch: Partial<UserDraft>) {
    userList.value = userList.value.map((u) => (u.id === id ? { ...u, ...patch, id: u.id } : u))
  }

  function removeUser(id: string) {
    userList.value = userList.value.filter((u) => u.id !== id)
  }

  function bulkRemoveUsers(ids: Iterable<string>) {
    const set = new Set(ids)
    userList.value = userList.value.filter((u) => !set.has(u.id))
  }

  function bulkSetUserStatus(ids: Iterable<string>, status: UserStatus) {
    const set = new Set(ids)
    userList.value = userList.value.map((u) => (set.has(u.id) ? { ...u, status } : u))
  }

  function setUserStatus(id: string, status: UserStatus) {
    updateUser(id, { status })
  }

  function toggleUserStatus(id: string) {
    const user = getUserById(id)
    if (user) updateUser(id, { status: user.status === 'banned' ? 'active' : 'banned' })
  }

  function resetUsers() {
    userList.value = seedUsers()
  }

  return {
    activeCount,
    adminCount,
    bannedCount,
    bulkRemoveUsers,
    bulkSetUserStatus,
    createUser,
    getUserById,
    list: userList,
    removeUser,
    resetUsers,
    setUserStatus,
    toggleUserStatus,
    total,
    totalFollowers,
    updateUser,
  }
}
