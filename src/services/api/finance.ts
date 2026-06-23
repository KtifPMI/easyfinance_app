import { apiCall, isLoggedIn } from './client'
import { Account, Budget, Category, FinancialEvent, Goal, Operation, Recommendation, Tag } from '../../types'
import {
  mockAccounts, mockBudget, mockCategories, mockEvents, mockGoals,
  mockOperations, mockRecommendations, mockTags,
} from './mockData'

let localAccounts: Account[] = [...mockAccounts]
let localOperations: Operation[] = [...mockOperations]
let localCategories: Category[] = [...mockCategories]
let localBudget: Budget = { ...mockBudget }
let localGoals: Goal[] = [...mockGoals]
let localEvents: FinancialEvent[] = [...mockEvents]

const genId = () => Math.random().toString(36).slice(2, 10)

const ACCOUNT_COLORS: Record<string, string> = {
  '1': '#16A34A', '2': '#2563EB', '9': '#DC2626', '5': '#7C3AED',
  '6': '#0EA5E9', '7': '#F97316', '8': '#DB2777', '15': '#0891B2', '16': '#334155',
}
const ACCOUNT_ICONS: Record<string, string> = {
  '1': 'cash', '2': 'credit-card', '9': 'bank', '5': 'piggy-bank',
  '6': 'account-arrow-left', '7': 'account-arrow-right', '8': 'credit-card-outline',
  '15': 'wallet', '16': 'bank-outline',
}
const CATEGORY_COLORS = ['#16A34A','#2563EB','#DC2626','#7C3AED','#F97316','#0EA5E9','#DB2777','#334155']
const CURRENCY_MAP: Record<string, string> = { '1': 'RUB', '2': 'USD', '3': 'EUR', '4': 'GBP', '5': 'CNY' }

interface EfAccount { id: string; name: string; type_id: string; state: string; currency_id: string; balance?: string; init_balance?: string; deleted_at: string | null }
interface EfCategory { id: string; name: string; type?: string; icon?: string; deleted_at: string | null }
interface EfOperation { id: string; account_id: string; category_id: string; amount: string; date: string; time?: string; comment?: string; tags?: string; type: string; transfer_account_id?: string | null; transfer_amount?: string | null; deleted_at: string | null }

function mapAccount(a: EfAccount): Account {
  return {
    id: String(a.id), name: a.name,
    balance: Number(a.balance ?? a.init_balance ?? 0),
    currency: CURRENCY_MAP[a.currency_id] || 'RUB',
    icon: ACCOUNT_ICONS[a.type_id] || 'wallet',
    color: ACCOUNT_COLORS[a.type_id] || '#16A34A',
    includeInTotal: a.state !== '2',
  }
}

function mapCategory(c: EfCategory, i: number): Category {
  const type = c.type === '1' ? 'income' : c.type === '0' ? 'transfer' : 'expense'
  return {
    id: String(c.id), name: c.name, type,
    icon: c.icon || 'shape', color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }
}

function mapOperation(o: EfOperation): Operation {
  const type = o.type === '1' ? 'income' : o.type === '2' ? 'transfer' : 'expense'
  return {
    id: String(o.id), type,
    amount: Math.abs(Number(o.amount)),
    currency: '1',
    date: `${o.date}T${o.time || '00:00:00'}`,
    accountId: String(o.account_id),
    toAccountId: o.transfer_account_id ? String(o.transfer_account_id) : undefined,
    categoryId: o.category_id ? String(o.category_id) : undefined,
    tagIds: o.tags ? o.tags.split(',').filter(Boolean) : undefined,
    comment: o.comment,
    isDeleted: !!o.deleted_at,
  }
}

function operationToEf(op: Operation | Omit<Operation, 'id'>, id?: string) {
  const signed = op.type === 'expense' ? -Math.abs(op.amount) : Math.abs(op.amount)
  const [date, time] = op.date.includes('T') ? op.date.split('T') : [op.date, '00:00:00']
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000')
  const base: Record<string, any> = {
    account_id: op.accountId, amount: signed.toFixed(2), date, time: time?.slice(0, 8) || '00:00:00',
    category_id: op.categoryId, comment: op.comment || '',
    type: op.type === 'income' ? '1' : op.type === 'transfer' ? '2' : '0',
    updated_at: now,
  }
  if (op.type === 'transfer' && op.toAccountId) {
    base.transfer_account_id = op.toAccountId
    base.transfer_amount = Math.abs(op.amount).toFixed(2)
  }
  if (id) base.id = id; else base.created_at = now
  return base
}

export const financeApi = {
  async getAccounts(): Promise<Account[]> {
    if (!isLoggedIn()) return localAccounts
    try {
      const data = await apiCall<{ accounts: EfAccount[] }>('accounts.get', { fields: 'init_balance,balance' })
      localAccounts = (data.accounts || []).filter(a => !a.deleted_at).map(mapAccount)
      return localAccounts
    } catch { return localAccounts }
  },

  async getCategories(): Promise<Category[]> {
    if (!isLoggedIn()) return localCategories
    try {
      const data = await apiCall<{ categories: EfCategory[] }>('categories.get')
      localCategories = (data.categories || []).filter(c => !c.deleted_at).map(mapCategory)
      return localCategories
    } catch { return localCategories }
  },

  async getTags(): Promise<Tag[]> {
    if (!isLoggedIn()) return mockTags
    try {
      const data = await apiCall<{ tags: { id: string; name: string }[] }>('tags.get')
      return (data.tags || []).map(t => ({ id: String(t.id), name: t.name }))
    } catch { return mockTags }
  },

  async getOperations(): Promise<Operation[]> {
    if (!isLoggedIn()) return localOperations.filter(o => !o.isDeleted)
    try {
      const data = await apiCall<{ operations: EfOperation[] }>('operations.get')
      localOperations = (data.operations || []).map(mapOperation)
      return localOperations.filter(o => !o.isDeleted)
    } catch { return localOperations.filter(o => !o.isDeleted) }
  },

  async getDeletedOperations(): Promise<Operation[]> {
    if (!isLoggedIn()) return localOperations.filter(o => o.isDeleted)
    try {
      const data = await apiCall<{ operations: EfOperation[] }>('operations.get', { options: 'deleted' })
      return (data.operations || []).filter(o => !!o.deleted_at).map(mapOperation)
    } catch { return localOperations.filter(o => o.isDeleted) }
  },

  async addOperation(op: Omit<Operation, 'id'>): Promise<Operation> {
    const newOp: Operation = { ...op, id: genId() }
    localOperations = [newOp, ...localOperations]
    if (op.type === 'expense') {
      localAccounts = localAccounts.map(a => a.id === op.accountId ? { ...a, balance: a.balance - op.amount } : a)
    } else if (op.type === 'income') {
      localAccounts = localAccounts.map(a => a.id === op.accountId ? { ...a, balance: a.balance + op.amount } : a)
    } else if (op.type === 'transfer') {
      localAccounts = localAccounts.map(a => {
        if (a.id === op.accountId) return { ...a, balance: a.balance - op.amount }
        if (a.id === op.toAccountId) return { ...a, balance: a.balance + op.amount }
        return a
      })
    }
    if (isLoggedIn()) {
      try {
        const data = await apiCall<{ operations: EfOperation[] }>('operations.post', {
          request: { request_info: { method: 'operations.post' }, request_data: { operations: [operationToEf(op)] } },
        })
        const created = data.operations?.[0]
        if (created) {
          localOperations = localOperations.map(o => o.id === newOp.id ? { ...newOp, id: String(created.id) } : o)
          return { ...newOp, id: String(created.id) }
        }
      } catch {}
    }
    return newOp
  },

  async updateOperation(id: string, patch: Partial<Operation>): Promise<Operation> {
    const current = localOperations.find(o => o.id === id)
    if (!current) throw new Error('Operation not found')
    const merged = { ...current, ...patch }
    localOperations = localOperations.map(o => o.id === id ? merged : o)
    if (isLoggedIn()) {
      try {
        await apiCall('operations.set', {
          request: { request_info: { method: 'operations.set' }, request_data: { operations: [operationToEf(merged, id)] } },
        })
      } catch {}
    }
    return merged
  },

  async deleteOperation(id: string): Promise<void> {
    const current = localOperations.find(o => o.id === id)
    if (current && !current.isDeleted) {
      if (current.type === 'expense') {
        localAccounts = localAccounts.map(a => a.id === current.accountId ? { ...a, balance: a.balance + current.amount } : a)
      } else if (current.type === 'income') {
        localAccounts = localAccounts.map(a => a.id === current.accountId ? { ...a, balance: a.balance - current.amount } : a)
      } else if (current.type === 'transfer') {
        localAccounts = localAccounts.map(a => {
          if (a.id === current.accountId) return { ...a, balance: a.balance + current.amount }
          if (a.id === current.toAccountId) return { ...a, balance: a.balance - current.amount }
          return a
        })
      }
    }
    localOperations = localOperations.map(o => o.id === id ? { ...o, isDeleted: true } : o)
    if (isLoggedIn()) {
      try {
        await apiCall('operations.set', {
          request: { request_info: { method: 'operations.set' }, request_data: { operations: [{ ...operationToEf(current!, id), deleted_at: new Date().toISOString().replace(/\.\d{3}Z$/, '+0000') }] } },
        })
      } catch {}
    }
  },

  async getBudget(): Promise<Budget> {
    if (!isLoggedIn()) return localBudget
    try {
      const data = await apiCall<{ budget: { categories?: { category_id: string; planned: string; spent: string }[] } }>('budget.get')
      const cats = data.budget?.categories || []
      if (cats.length) {
        localBudget = {
          ...mockBudget, plannedExpense: cats.reduce((s, c) => s + Number(c.planned), 0),
          actualExpense: cats.reduce((s, c) => s + Number(c.spent), 0),
          categories: cats.map(c => ({ categoryId: String(c.category_id), planned: Number(c.planned), spent: Number(c.spent) })),
        }
      }
      return localBudget
    } catch { return localBudget }
  },

  async getGoals(): Promise<Goal[]> { return localGoals },
  async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const g: Goal = { ...goal, id: genId() }
    localGoals = [...localGoals, g]
    return g
  },
  async updateGoal(id: string, patch: Partial<Goal>): Promise<Goal> {
    localGoals = localGoals.map(g => g.id === id ? { ...g, ...patch } : g)
    return localGoals.find(g => g.id === id)!
  },

  async getEvents(): Promise<FinancialEvent[]> { return localEvents },
  async addEvent(event: Omit<FinancialEvent, 'id'>): Promise<FinancialEvent> {
    const e = { ...event, id: genId() }
    localEvents = [...localEvents, e]
    return e
  },

  async getRecommendations(): Promise<Recommendation[]> { return mockRecommendations },
  async getExchangeRates() { return [] },
}
