import { create } from 'zustand';
import { financeApi } from '../services/api';
import { Account, Budget, Category, FinancialEvent, Goal, Operation, Recommendation, Tag } from '../types';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  operations: Operation[];
  budget: Budget | null;
  goals: Goal[];
  events: FinancialEvent[];
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  loaded: boolean;

  loadAll: () => Promise<void>;
  refresh: () => Promise<void>;
  addOperation: (op: Omit<Operation, 'id'>) => Promise<void>;
  updateOperation: (id: string, patch: Partial<Operation>) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  categories: [],
  tags: [],
  operations: [],
  budget: null,
  goals: [],
  events: [],
  recommendations: [],
  isLoading: false,
  error: null,
  loaded: false,

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [accounts, categories, tags, operations, budget, goals, events, recommendations] = await Promise.all([
        financeApi.getAccounts(),
        financeApi.getCategories(),
        financeApi.getTags(),
        financeApi.getOperations(),
        financeApi.getBudget(),
        financeApi.getGoals(),
        financeApi.getEvents(),
        financeApi.getRecommendations(),
      ]);
      set({ accounts, categories, tags, operations, budget, goals, events, recommendations, isLoading: false, loaded: true });
    } catch (e: any) {
      set({ error: e.message || 'Ошибка загрузки данных', isLoading: false });
    }
  },

  refresh: async () => {
    await get().loadAll();
  },

  addOperation: async (op) => {
    await financeApi.addOperation(op);
    const [accounts, operations, budget] = await Promise.all([
      financeApi.getAccounts(),
      financeApi.getOperations(),
      financeApi.getBudget(),
    ]);
    set({ accounts, operations, budget });
  },

  updateOperation: async (id, patch) => {
    await financeApi.updateOperation(id, patch);
    const [accounts, operations, budget] = await Promise.all([
      financeApi.getAccounts(),
      financeApi.getOperations(),
      financeApi.getBudget(),
    ]);
    set({ accounts, operations, budget });
  },

  deleteOperation: async (id) => {
    await financeApi.deleteOperation(id);
    const [accounts, operations, budget] = await Promise.all([
      financeApi.getAccounts(),
      financeApi.getOperations(),
      financeApi.getBudget(),
    ]);
    set({ accounts, operations, budget });
  },

  addGoal: async (goal) => {
    await financeApi.addGoal(goal);
    const goals = await financeApi.getGoals();
    set({ goals });
  },

  updateGoal: async (id, patch) => {
    await financeApi.updateGoal(id, patch);
    const goals = await financeApi.getGoals();
    set({ goals });
  },
}));
