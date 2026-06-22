import { Account, Budget, Operation } from '../types';

export interface FinHealthIndicators {
  finState: number;   // Общий: среднее остальных (0–100)
  money: number;      // Ликвидность: остаток / мес.расходы (100% = 3 мес.)
  budget: number;     // Бюджет: насколько расходы ниже плана (100% = в норме)
  debt: number;       // Долговая нагрузка: долги / доход (100% = нет долгов)
  savings: number;    // Норма сбережений: (доход-расход) / доход (100% = 20%+)
}

export function calcFinHealth(
  accounts: Account[],
  operations: Operation[],
  budget: Budget | null
): FinHealthIndicators {
  const now = new Date();
  const { start, end } = getMonthRange(now);
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end));

  const monthIncome = sumByType(monthOps, 'income');
  const monthExpense = sumByType(monthOps, 'expense');
  const totalBalance = getTotalBalance(accounts);

  // Ликвидность: цель — 3 месяца покрытия расходов
  const avgExpense = monthExpense || 1;
  const liquidityMonths = totalBalance / avgExpense;
  const money = Math.min(100, Math.round(liquidityMonths / 3 * 100));

  // Бюджет: 100% = расходы не превысили план, 0% = двойной перерасход
  let budgetScore = 100;
  if (budget && budget.plannedExpense > 0) {
    const ratio = budget.actualExpense / budget.plannedExpense;
    budgetScore = Math.max(0, Math.min(100, Math.round((2 - ratio) * 50)));
  }

  // Долговая нагрузка: долги (счета типа "Я должен") / доход
  // В нашей модели нет отдельного признака долговых счетов, считаем по бюджету
  // Простая оценка: если нет долгов = 100%
  const debtScore = 100; // заглушка, т.к. в demo-данных долгов нет

  // Норма сбережений: цель 20% дохода
  let savings = 0;
  if (monthIncome > 0) {
    const savingsRate = (monthIncome - monthExpense) / monthIncome;
    savings = Math.max(0, Math.min(100, Math.round(savingsRate / 0.2 * 100)));
  }

  const finState = Math.round((money + budgetScore + debtScore + savings) / 4);

  return { finState, money, budget: budgetScore, debt: debtScore, savings };
}

export function isInPeriod(dateIso: string, start: Date, end: Date): boolean {
  const d = new Date(dateIso);
  return d >= start && d <= end;
}

export function getMonthRange(date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export function sumByType(operations: Operation[], type: 'income' | 'expense'): number {
  return operations.filter((o) => o.type === type && !o.isDeleted).reduce((sum, o) => sum + o.amount, 0);
}

export function getTotalBalance(accounts: { balance: number; includeInTotal: boolean }[]): number {
  return accounts.filter((a) => a.includeInTotal).reduce((sum, a) => sum + a.balance, 0);
}
