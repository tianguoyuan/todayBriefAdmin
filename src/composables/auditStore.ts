import { STORAGE_PREFIX } from '~/utils/constants'

export type AuditAction = 'create' | 'update' | 'delete' | 'restore' | 'export' | 'publish' | 'other'

export interface AuditRecord {
  id: string
  at: number
  action: AuditAction
  module: string
  detail: string
  actor: string
}

const KEY = `${STORAGE_PREFIX}audit`

function seedAudit(): AuditRecord[] {
  const now = Date.now()
  return [
    { action: 'export', actor: '管理员', at: now - 3_600_000, detail: '导出了新闻数据备份', id: 'a1', module: '系统' },
    { action: 'create', actor: '管理员', at: now - 86_400_000, detail: '新建分类「科技」', id: 'a2', module: '分类' },
  ]
}

export const auditList = useLocalStorage<AuditRecord[]>(KEY, seedAudit, { shallow: true })

export function logAudit(action: AuditAction, module: string, detail: string) {
  const record: AuditRecord = {
    action,
    actor: '管理员',
    at: Date.now(),
    detail,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    module,
  }
  auditList.value = [record, ...auditList.value].slice(0, 200)
}

export function useAuditStore() {
  const total = computed(() => auditList.value.length)

  function resetAudit() {
    auditList.value = seedAudit()
  }

  return {
    list: auditList,
    resetAudit,
    total,
  }
}
