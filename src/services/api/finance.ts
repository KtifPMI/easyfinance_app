import { Account, Budget, Category, FinancialEvent, Goal, Operation, OperationType, Recommendation, Tag } from '../../types';
import { efCall, isDemoMode } from './client';
import {
  mockAccounts,
  mockBudget,
  mockCategories,
  mockEvents,
  mockExchangeRates,
  mockGoals,
  mockOperations,
  mockRecommendations,
  mockTags,
} from './mockData';

// ---------------------------------------------------------------------------
// Локальный стор — источник данных для демо-режима и fallback при ошибках API.
// ---------------------------------------------------------------------------
let localAccounts: Account[] = [...mockAccounts];
let localOperations: Operation[] = [...mockOperations];
let localCategories: Category[] = [...mockCategories];
let localBudget: Budget = { ...mockBudget };
let localGoals: Goal[] = [...mockGoals];
let localEvents: FinancialEvent[] = [...mockEvents];

const genId = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------
// Маппинг EasyFinance API → типы приложения
// ---------------------------------------------------------------------------
const ACCOUNT_COLORS: Record<string, string> = {
  '1': '#16A34A', '2': '#2563EB', '9': '#DC2626', '5': '#7C3AED',
  '6': '#0EA5E9', '7': '#F97316', '8': '#DB2777', '15': '#0891B2', '16': '#334155',
};
const ACCOUNT_ICONS: Record<string, string> = {
  '1': 'cash', '2': 'credit-card', '9': 'bank', '5': 'piggy-bank',
  '6': 'account-arrow-left', '7': 'account-arrow-right', '8': 'credit-card-outline',
  '15': 'wallet', '16': 'bank-outline',
};
const CATEGORY_COLORS = ['#16A34A','#2563EB','#DC2626','#7C3AED','#F97316','#0EA5E9','#DB2777','#334155'];

interface EfAccount { id: string; name: string; type_id: string; state: string; currency_id: string; balance?: string; init_balance?: string; deleted_at: string | null; }
interface EfCategory { id: string; name: string; type?: string; icon?: string; deleted_at: string | null; }
interface EfOperation { id: string; account_id: string; category_id: string; amount: string; date: string; time?: string; comment?: string; tags?: string; type: string; transfer_account_id?: string | null; transfer_amount?: string | null; deleted_at: string | null; }

function mapAccount(a: EfAccount): Account {
  return { id: String(a.id), name: a.name, balance: Number(a.balance ?? a.init_balance ?? 0), currency: String(a.currency_id), icon: ACCOUNT_ICONS[a.type_id] || 'wallet', color: ACCOUNT_COLORS[a.type_id] || '#16A34A', includeInTotal: a.state !== '2' };
}
function mapCategory(c: EfCategory, i: number): Category {
  const type: OperationType = c.type === '1' ? 'income' : c.type === '0' ? 'transfer' : 'expense';
  return { id: String(c.id), name: c.name, type, icon: c.icon || 'shape', color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] };
}
function mapOperation(o: EfOperation): Operation {
  const type: OperationType = o.type === '1' ? 'income' : o.type === '2' ? 'transfer' : 'expense';
  return { id: String(o.id), type, amount: Math.abs(Number(o.amount)), currency: '1', date: `${o.date}T${o.time || '00:00:00'}`, accountId: String(o.account_id), toAccountId: o.transfer_account_id ? String(o.transfer_account_id) : undefined, categoryId: o.category_id ? String(o.category_id) : undefined, tagIds: o.tags ? o.tags.split(',').filter(Boolean) : undefined, comment: o.comment, isDeleted: !!o.deleted_at };
}
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');
function operationToEf(op: Operation | Omit<Operation, 'id'>, id?: string) {
  const signed = op.type === 'expense' ? -Math.abs(op.amount) : Math.abs(op.amount);
  const [date, time] = op.date.includes('T') ? op.date.split('T') : [op.date, '00:00:00'];
  const base: Record<string, unknown> = { account_id: op.accountId, amount: signed.toFixed(2), date, time: time?.slice(0, 8) || '00:00:00', category_id: op.categoryId, comment: op.comment || '', type: op.type === 'income' ? '1' : op.type === 'transfer' ? '2' : '0', updated_at: nowIso() };
  if (op.type === 'transfer' && op.toAccountId) { base.transfer_account_id = op.toAccountId; base.transfer_amount = Math.abs(op.amount).toFixed(2); }
  if (id) { base.id = id; } else { base.created_at = nowIso(); }
  return base;
}

// ---------------------------------------------------------------------------
// Финансовое API
// ---------------------------------------------------------------------------
export const financeApi = {
  async getAccounts(): Promise<Account[]> {
    if (isDemoMode()) return localAccounts;
    try {
      const data = await efCall<{ accounts: EfAccount[] }>('accounts.get', { params: { fields: 'init_balance,balance' } });
      localAccounts = (data.accounts || []).filter(a => !a.deleted_at).map(mapAccount);
      return localAccounts;
    } catch {
      return localAccounts;
    }
  },

  async getCategories(): Promise<Category[]> {
    if (isDemoMode()) return localCategories;
    try {
      const data = await efCall<{ categories: EfCategory[] }>('categories.get');
      localCategories = (data.categories || []).filter(c => !c.deleted_at).map(mapCategory);
      return localCategories;
    } catch {
      return localCategories;
    }
  },

  async getTags(): Promise<Tag[]> {
    if (isDemoMode()) return mockTags;
    try {
      const data = await efCall<{ tags: { id: string; name: string }[] }>('tags.get');
      return (data.tags || []).map(t => ({ id: String(t.id), name: t.name }));
    } catch {
      return mockTags;
    }
  },

  async getOperations(): Promise<Operation[]> {
    if (isDemoMode()) return localOperations.filter(o => !o.isDeleted);
    try {
      const data = await efCall<{ operations: EfOperation[] }>('operations.get');
      localOperations = (data.operations || []).map(mapOperation);
      return localOperations.filter(o => !o.isDeleted);
    } catch {
      return localOperations.filter(o => !o.isDeleted);
    }
  },

  async getDeletedOperations(): Promise<Operation[]> {
    if (isDemoMode()) return localOperations.filter(o => o.isDeleted);
    try {
      const data = await efCall<{ operations: EfOperation[] }>('operations.get', { params: { options: 'deleted' } });
      return (data.operations || []).filter(o => !!o.deleted_at).map(mapOperation);
    } catch {
      return localOperations.filter(o => o.isDeleted);
    }
  },

  async addOperation(op: Omit<Operation, 'id'>): Promise<Operation> {
    const newOp: Operation = { ...op, id: genId() };
    localOperations = [newOp, ...localOperations];

    // Обновляем балансы счетов локально
    if (op.type === 'expense') {
      localAccounts = localAccounts.map(a =>
        a.id === op.accountId ? { ...a, balance: a.balance - op.amount } : a
      );
    } else if (op.type === 'income') {
      localAccounts = localAccounts.map(a =>
        a.id === op.accountId ? { ...a, balance: a.balance + op.amount } : a
      );
    } else if (op.type === 'transfer') {
      localAccounts = localAccounts.map(a => {
        if (a.id === op.accountId) return { ...a, balance: a.balance - op.amount };
        if (a.id === op.toAccountId) return { ...a, balance: a.balance + op.amount };
        return a;
      });
    }

    // Обновляем бюджет локально
    if (op.type === 'expense') {
      localBudget = { ...localBudget, actualExpense: localBudget.actualExpense + op.amount };
      if (op.categoryId) {
        localBudget = {
          ...localBudget,
          categories: localBudget.categories.map(c =>
            c.categoryId === op.categoryId ? { ...c, spent: c.spent + op.amount } : c
          ),
        };
      }
    } else if (op.type === 'income') {
      localBudget = { ...localBudget, actualIncome: localBudget.actualIncome + op.amount };
    }

    if (!isDemoMode()) {
      try {
        const data = await efCall<{ operations: EfOperation[] }>('operations.post', {
          httpMethod: 'POST',
          body: { request: { request_info: { method: 'operations.post' }, request_data: { operations: [operationToEf(op)] } } },
        });
        const created = data.operations?.[0];
        if (created) {
          localOperations = localOperations.map(o => o.id === newOp.id ? { ...newOp, id: String(created.id) } : o);
          return { ...newOp, id: String(created.id) };
        }
      } catch { /* сохранено локально */ }
    }
    return newOp;
  },

  async updateOperation(id: string, patch: Partial<Operation>): Promise<Operation> {
    const current = localOperations.find(o => o.id === id);
    if (!current) throw new Error('Операция не найдена');
    const merged = { ...current, ...patch };

    // Откатываем старую операцию и применяем новую к балансам
    const revert = (op: Operation, factor: number) => {
      if (op.type === 'expense') {
        localAccounts = localAccounts.map(a =>
          a.id === op.accountId ? { ...a, balance: a.balance + op.amount * factor } : a
        );
      } else if (op.type === 'income') {
        localAccounts = localAccounts.map(a =>
          a.id === op.accountId ? { ...a, balance: a.balance - op.amount * factor } : a
        );
      } else if (op.type === 'transfer') {
        localAccounts = localAccounts.map(a => {
          if (a.id === op.accountId) return { ...a, balance: a.balance + op.amount * factor };
          if (a.id === op.toAccountId) return { ...a, balance: a.balance - op.amount * factor };
          return a;
        });
      }
    };
    revert(current, 1); // откат старой
    revert(merged, -1); // применение новой

    localOperations = localOperations.map(o => o.id === id ? merged : o);
    if (!isDemoMode()) {
      try {
        await efCall('operations.set', { httpMethod: 'POST', params: { operation_id: id }, body: { request: { request_info: { method: 'operations.set' }, request_data: { operations: [operationToEf(merged, id)] } } } });
      } catch { /* сохранено локально */ }
    }
    return merged;
  },

  async deleteOperation(id: string): Promise<void> {
    const current = localOperations.find(o => o.id === id);
    if (current && !current.isDeleted) {
      // Откатываем баланс
      if (current.type === 'expense') {
        localAccounts = localAccounts.map(a =>
          a.id === current.accountId ? { ...a, balance: a.balance + current.amount } : a
        );
        localBudget = { ...localBudget, actualExpense: Math.max(0, localBudget.actualExpense - current.amount) };
        if (current.categoryId) {
          localBudget = {
            ...localBudget,
            categories: localBudget.categories.map(c =>
              c.categoryId === current.categoryId ? { ...c, spent: Math.max(0, c.spent - current.amount) } : c
            ),
          };
        }
      } else if (current.type === 'income') {
        localAccounts = localAccounts.map(a =>
          a.id === current.accountId ? { ...a, balance: a.balance - current.amount } : a
        );
        localBudget = { ...localBudget, actualIncome: Math.max(0, localBudget.actualIncome - current.amount) };
      } else if (current.type === 'transfer') {
        localAccounts = localAccounts.map(a => {
          if (a.id === current.accountId) return { ...a, balance: a.balance + current.amount };
          if (a.id === current.toAccountId) return { ...a, balance: a.balance - current.amount };
          return a;
        });
      }
    }
    localOperations = localOperations.map(o => o.id === id ? { ...o, isDeleted: true } : o);
    if (!isDemoMode()) {
      try {
        const current = localOperations.find(o => o.id === id);
        if (current) await efCall('operations.set', { httpMethod: 'POST', params: { operation_id: id }, body: { request: { request_info: { method: 'operations.set' }, request_data: { operations: [{ ...operationToEf(current, id), deleted_at: nowIso() }] } } } });
      } catch { /* сохранено локально */ }
    }
  },

  async restoreOperation(id: string): Promise<void> {
    localOperations = localOperations.map(o => o.id === id ? { ...o, isDeleted: false } : o);
    if (!isDemoMode()) {
      try {
        const current = localOperations.find(o => o.id === id);
        if (current) await efCall('operations.set', { httpMethod: 'POST', params: { operation_id: id }, body: { request: { request_info: { method: 'operations.set' }, request_data: { operations: [{ ...operationToEf(current, id), deleted_at: null }] } } } });
      } catch { /* сохранено локально */ }
    }
  },

  async getBudget(): Promise<Budget> {
    if (isDemoMode()) return localBudget;
    try {
      const data = await efCall<{ budget: { categories?: { category_id: string; planned: string; spent: string }[] } }>('budget.get');
      const cats = data.budget?.categories || [];
      if (cats.length) {
        localBudget = { ...mockBudget, plannedExpense: cats.reduce((s, c) => s + Number(c.planned), 0), actualExpense: cats.reduce((s, c) => s + Number(c.spent), 0), categories: cats.map(c => ({ categoryId: String(c.category_id), planned: Number(c.planned), spent: Number(c.spent) })) };
      }
      return localBudget;
    } catch {
      return localBudget;
    }
  },

  async updateBudgetCategory(categoryId: string, planned: number): Promise<Budget> {
    localBudget = { ...localBudget, categories: localBudget.categories.map(c => c.categoryId === categoryId ? { ...c, planned } : c) };
    return localBudget;
  },

  // Цели — нет в EasyFinance API, только локально
  async getGoals(): Promise<Goal[]> { return localGoals; },
  async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const newGoal: Goal = { ...goal, id: genId() };
    localGoals = [...localGoals, newGoal];
    return newGoal;
  },
  async updateGoal(id: string, patch: Partial<Goal>): Promise<Goal> {
    localGoals = localGoals.map(g => g.id === id ? { ...g, ...patch } : g);
    return localGoals.find(g => g.id === id)!;
  },

  // События — нет в EasyFinance API, только локально
  async getEvents(): Promise<FinancialEvent[]> { return localEvents; },
  async addEvent(event: Omit<FinancialEvent, 'id'>): Promise<FinancialEvent> {
    const newEvent = { ...event, id: genId() };
    localEvents = [...localEvents, newEvent];
    return newEvent;
  },

  async getRecommendations(): Promise<Recommendation[]> { return mockRecommendations; },
  async getExchangeRates() { return mockExchangeRates; },
};
