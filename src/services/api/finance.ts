import { apiGet, apiPost, isLoggedIn } from './client'
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

interface SiteAccount { id: string; name: string; type_id: string; state: string; currency_id: string; total_sum?: string; init_balance?: string; deleted_at: string | null }
interface SiteCategory { id: string; name: string; type?: string; deleted_at: string | null }
interface SiteOperation { id: string; account_id: string; category_id: string; money: string; date: string; time?: string; comment?: string; type: string; transfer_account_id?: string | null; deleted_at: string | null }

function mapAccount(a: SiteAccount): Account {
  return {
    id: String(a.id), name: a.name,
    balance: Number(a.total_sum ?? a.init_balance ?? 0),
    currency: String(a.currency_id),
    icon: ACCOUNT_ICONS[a.type_id] || 'wallet',
    color: ACCOUNT_COLORS[a.type_id] || '#16A34A',
    includeInTotal: a.state !== '2',
  }
}

function mapCategory(c: SiteCategory, i: number): Category {
  const type = c.type === '1' ? 'income' : c.type === '0' ? 'transfer' : 'expense'
  return {
    id: String(c.id), name: c.name, type,
    icon: 'shape', color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }
}

function mapOperation(o: SiteOperation): Operation {
  const type = o.type === '1' ? 'income' : o.type === '2' ? 'transfer' : 'expense'
  return {
    id: String(o.id), type,
    amount: Math.abs(Number(o.money)),
    currency: '1',
    date: `${o.date}T${o.time || '00:00:00'}`,
    accountId: String(o.account_id),
    toAccountId: o.transfer_account_id ? String(o.transfer_account_id) : undefined,
    categoryId: o.category_id ? String(o.category_id) : undefined,
    comment: o.comment,
    isDeleted: !!o.deleted_at,
  }
}

export const financeApi = {
  async getAccounts(): Promise<Account[]> {
    if (!isLoggedIn()) return localAccounts
    try {
      const data = await apiGet<{ accounts: SiteAccount[] }>('/account/listAccounts/')
      localAccounts = (data.accounts || []).filter(a => !a.deleted_at).map(mapAccount)
      return localAccounts
    } catch {
      return localAccounts
    }
  },

  async getCategories(): Promise<Category[]> {
    if (!isLoggedIn()) return localCategories
    try {
      const data = await apiGet<any>('/account/listAccounts/')
      localCategories = (data.sys_categories || []).filter((c: any) => !c.deleted_at).map(mapCategory)
      return localCategories
    } catch {
      return localCategories
    }
  },

  async getTags(): Promise<Tag[]> {
    return mockTags
  },

  async getOperations(): Promise<Operation[]> {
    if (!isLoggedIn()) return localOperations.filter(o => !o.isDeleted)
    try {
      const data = await apiGet<{ operations: SiteOperation[] }>('/operation/listOperations/')
      localOperations = (data.operations || []).map(mapOperation)
      return localOperations.filter(o => !o.isDeleted)
    } catch {
      return localOperations.filter(o => !o.isDeleted)
    }
  },

  async getDeletedOperations(): Promise<Operation[]> {
    return localOperations.filter(o => o.isDeleted)
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
    return newOp
  },

  async updateOperation(id: string, patch: Partial<Operation>): Promise<Operation> {
    const current = localOperations.find(o => o.id === id)
    if (!current) throw new Error('Operation not found')
    const merged = { ...current, ...patch }
    localOperations = localOperations.map(o => o.id === id ? merged : o)
    return merged
  },

  async deleteOperation(id: string): Promise<void> {
    localOperations = localOperations.map(o => o.id === id ? { ...o, isDeleted: true } : o)
  },

  async getBudget(): Promise<Budget> {
    if (!isLoggedIn()) return localBudget
    try {
      const now = new Date()
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const data = await apiPost<any>('/my/budget/load/', {
        start,
        type: 'month',
        copy_for_date: 'false',
        final_cash_balances: '[]',
        use_hidden_acc_option: 'true',
      })
      const cats = data?.categories || []
      if (cats.length) {
        localBudget = {
          ...mockBudget,
          plannedExpense: cats.reduce((s: number, c: any) => s + Number(c.planned_sum || 0), 0),
          actualExpense: cats.reduce((s: number, c: any) => s + Number(c.fact_sum || 0), 0),
          categories: cats.map((c: any) => ({
            categoryId: String(c.category_id),
            planned: Number(c.planned_sum || 0),
            spent: Number(c.fact_sum || 0),
          })),
        }
      }
      return localBudget
    } catch {
      return localBudget
    }
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
