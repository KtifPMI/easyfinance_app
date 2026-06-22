import {
  Account,
  Budget,
  Category,
  FinancialEvent,
  Goal,
  Operation,
  Recommendation,
  Tag,
  User,
} from '../../types';

export const mockUser: User = {
  id: 'u1',
  name: 'Алексей Иванов',
  email: 'demo@easyfinance.ru',
  currency: 'RUB',
  plan: 'free',
};

export const mockAccounts: Account[] = [
  { id: 'a1', name: 'Наличные', balance: 12500, currency: 'RUB', icon: 'cash', color: '#16A34A', includeInTotal: true },
  { id: 'a2', name: 'Карта Тинькофф', balance: 84300, currency: 'RUB', icon: 'card', color: '#FFD700', includeInTotal: true },
  { id: 'a3', name: 'Сбербанк', balance: 213400, currency: 'RUB', icon: 'card', color: '#1565C0', includeInTotal: true },
  { id: 'a4', name: 'Накопительный счёт', balance: 350000, currency: 'RUB', icon: 'piggy-bank', color: '#7C3AED', includeInTotal: true },
];

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Продукты', type: 'expense', icon: 'cart', color: '#F59E0B' },
  { id: 'c2', name: 'Транспорт', type: 'expense', icon: 'car', color: '#3B82F6' },
  { id: 'c3', name: 'Кафе и рестораны', type: 'expense', icon: 'silverware-fork-knife', color: '#EF4444' },
  { id: 'c4', name: 'Жильё', type: 'expense', icon: 'home', color: '#8B5CF6' },
  { id: 'c5', name: 'Развлечения', type: 'expense', icon: 'movie', color: '#EC4899' },
  { id: 'c6', name: 'Здоровье', type: 'expense', icon: 'heart-pulse', color: '#14B8A6' },
  { id: 'c7', name: 'Связь и интернет', type: 'expense', icon: 'wifi', color: '#0EA5E9' },
  { id: 'c8', name: 'Одежда', type: 'expense', icon: 'tshirt-crew', color: '#A855F7' },
  { id: 'c9', name: 'Зарплата', type: 'income', icon: 'cash-plus', color: '#16A34A' },
  { id: 'c10', name: 'Фриланс', type: 'income', icon: 'laptop', color: '#22C55E' },
  { id: 'c11', name: 'Подарки', type: 'income', icon: 'gift', color: '#10B981' },
  { id: 'c12', name: 'Инвестиции', type: 'income', icon: 'chart-line', color: '#059669' },
];

export const mockTags: Tag[] = [
  { id: 't1', name: 'Семья' },
  { id: 't2', name: 'Работа' },
  { id: 't3', name: 'Отпуск' },
  { id: 't4', name: 'Срочно' },
];

const today = new Date();
const iso = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const mockOperations: Operation[] = [
  { id: 'o1', type: 'expense', amount: 2350, currency: 'RUB', date: iso(0), accountId: 'a2', categoryId: 'c1', comment: 'Пятёрочка', tagIds: ['t1'] },
  { id: 'o2', type: 'expense', amount: 450, currency: 'RUB', date: iso(0), accountId: 'a1', categoryId: 'c2', comment: 'Метро' },
  { id: 'o3', type: 'income', amount: 95000, currency: 'RUB', date: iso(1), accountId: 'a3', categoryId: 'c9', comment: 'Зарплата', tagIds: ['t2'] },
  { id: 'o4', type: 'expense', amount: 1200, currency: 'RUB', date: iso(1), accountId: 'a2', categoryId: 'c3', comment: 'Кофейня' },
  { id: 'o5', type: 'transfer', amount: 20000, currency: 'RUB', date: iso(2), accountId: 'a3', toAccountId: 'a4', comment: 'Перевод на накопления' },
  { id: 'o6', type: 'expense', amount: 35000, currency: 'RUB', date: iso(3), accountId: 'a3', categoryId: 'c4', comment: 'Аренда квартиры' },
  { id: 'o7', type: 'expense', amount: 890, currency: 'RUB', date: iso(4), accountId: 'a2', categoryId: 'c7', comment: 'Связь' },
  { id: 'o8', type: 'expense', amount: 3200, currency: 'RUB', date: iso(5), accountId: 'a2', categoryId: 'c5', comment: 'Кино и боулинг', tagIds: ['t1'] },
  { id: 'o9', type: 'income', amount: 18000, currency: 'RUB', date: iso(6), accountId: 'a2', categoryId: 'c10', comment: 'Проект на фрилансе', tagIds: ['t2'] },
  { id: 'o10', type: 'expense', amount: 5400, currency: 'RUB', date: iso(7), accountId: 'a2', categoryId: 'c8', comment: 'Одежда' },
];

export const mockBudget: Budget = {
  id: 'b1',
  period: '2026-06',
  plannedIncome: 110000,
  actualIncome: 113000,
  plannedExpense: 90000,
  actualExpense: 48490,
  categories: [
    { categoryId: 'c1', planned: 20000, spent: 9800 },
    { categoryId: 'c2', planned: 5000, spent: 2200 },
    { categoryId: 'c3', planned: 8000, spent: 6100 },
    { categoryId: 'c4', planned: 35000, spent: 35000 },
    { categoryId: 'c5', planned: 6000, spent: 3200 },
    { categoryId: 'c6', planned: 4000, spent: 0 },
    { categoryId: 'c7', planned: 1500, spent: 890 },
    { categoryId: 'c8', planned: 6000, spent: 5400 },
  ],
};

export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Подушка безопасности', targetAmount: 300000, currentAmount: 180000, deadline: '2026-12-31', icon: 'shield-check', color: '#16A34A', monthlyRecommendation: 17142 },
  { id: 'g2', title: 'Отпуск в Сочи', targetAmount: 120000, currentAmount: 45000, deadline: '2026-08-15', icon: 'beach', color: '#0EA5E9', monthlyRecommendation: 25000 },
  { id: 'g3', title: 'Новый ноутбук', targetAmount: 150000, currentAmount: 150000, deadline: '2026-05-01', icon: 'laptop', color: '#7C3AED', monthlyRecommendation: 0 },
];

const futureIso = (daysAhead: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
};

export const mockEvents: FinancialEvent[] = [
  { id: 'e1', title: 'Оплата аренды', date: futureIso(2), amount: 35000, type: 'expense', isRecurring: true, recurrenceRule: 'monthly' },
  { id: 'e2', title: 'Зарплата', date: futureIso(5), amount: 95000, type: 'income', isRecurring: true, recurrenceRule: 'monthly' },
  { id: 'e3', title: 'Платёж по кредиту', date: futureIso(7), amount: 12000, type: 'expense', isRecurring: true, recurrenceRule: 'monthly' },
  { id: 'e4', title: 'Напомнить продлить страховку', date: futureIso(10), type: 'reminder', isRecurring: false },
  { id: 'e5', title: 'Подписка на сервис', date: futureIso(14), amount: 599, type: 'expense', isRecurring: true, recurrenceRule: 'monthly' },
];

export const mockRecommendations: Recommendation[] = [
  { id: 'r1', title: 'Расходы на кафе превышают план', description: 'За последние 3 месяца вы тратите на кафе на 25% больше, чем планировали. Попробуйте установить лимит 6000 ₽ в месяц.', type: 'optimization', severity: 'medium' },
  { id: 'r2', title: 'Высокий уровень фиксированных расходов', description: 'Аренда занимает 38% от дохода. Финансовые эксперты рекомендуют не более 30%.', type: 'risk', severity: 'high' },
  { id: 'r3', title: 'Отличный прогресс по подушке безопасности', description: 'Вы накопили уже 60% от цели. Ещё 7 месяцев — и у вас будет резерв на полгода жизни.', type: 'tip', severity: 'low' },
  { id: 'r4', title: 'Настройте автоперевод на цели', description: 'Регулярные автоматические переводы помогают достигать целей на 30% быстрее.', type: 'tip', severity: 'low' },
];

export const mockExchangeRates = [
  { code: 'USD', name: 'Доллар США', rate: 92.45, change: 0.32 },
  { code: 'EUR', name: 'Евро', rate: 100.12, change: -0.15 },
  { code: 'CNY', name: 'Юань', rate: 12.78, change: 0.04 },
];
