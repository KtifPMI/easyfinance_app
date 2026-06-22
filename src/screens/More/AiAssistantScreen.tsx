import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/financeStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMoney } from '../../utils/format';
import { getTotalBalance, sumByType, getMonthRange, isInPeriod } from '../../utils/calc';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: { label: string; onPress: () => void };
}

// Разбираем текст пользователя и имитируем ответ ИИ
function parseIntent(
  text: string,
  context: { totalBalance: number; monthExpense: number; monthIncome: number; goals: any[]; operations: any[] }
): { reply: string; parsed?: { amount?: number; category?: string; comment?: string } } {
  const lower = text.toLowerCase();

  // Добавить операцию
  const amountMatch = text.match(/(\d[\d\s]*)\s*(руб|р\b|₽|тыс)?/i);
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/\s/g, '')) : null;

  if ((lower.includes('потратил') || lower.includes('купил') || lower.includes('заплатил') || lower.includes('потраченн')) && amount) {
    const catMap: Record<string, string> = {
      'ужин': 'Кафе и рестораны', 'обед': 'Кафе и рестораны', 'кофе': 'Кафе и рестораны', 'ресторан': 'Кафе и рестораны',
      'такси': 'Транспорт', 'метро': 'Транспорт', 'бензин': 'Транспорт',
      'продукт': 'Продукты', 'пятёрочк': 'Продукты', 'магазин': 'Продукты',
      'аренд': 'Жильё', 'квартир': 'Жильё',
      'кино': 'Развлечения', 'театр': 'Развлечения',
    };
    let category = 'Прочее';
    for (const [key, cat] of Object.entries(catMap)) {
      if (lower.includes(key)) { category = cat; break; }
    }
    return {
      reply: `Понял! Записываю расход **${formatMoney(amount)}** в категорию «${category}». Нажмите «Добавить» для подтверждения.`,
      parsed: { amount, category, comment: text },
    };
  }

  // Баланс
  if (lower.includes('баланс') || lower.includes('сколько денег') || lower.includes('остаток')) {
    return { reply: `Ваш общий баланс: **${formatMoney(context.totalBalance)}**.\n\nЗа этот месяц:\n• Доходы: ${formatMoney(context.monthIncome)}\n• Расходы: ${formatMoney(context.monthExpense)}\n• Экономия: ${formatMoney(context.monthIncome - context.monthExpense)}` };
  }

  // Прогноз
  if (lower.includes('прогноз') || lower.includes('хватит') || lower.includes('когда кончатся') || lower.includes('кассовый')) {
    const dailySpend = context.monthExpense / Math.max(new Date().getDate(), 1);
    const daysLeft = dailySpend > 0 ? Math.floor(context.totalBalance / dailySpend) : 999;
    const runOutDate = new Date();
    runOutDate.setDate(runOutDate.getDate() + daysLeft);
    if (daysLeft > 180) {
      return { reply: `При текущем темпе трат **${formatMoney(Math.round(dailySpend))}/день** ваших денег хватит на более чем 6 месяцев. Всё отлично! 💚` };
    }
    return { reply: `⚠️ При текущем темпе трат **${formatMoney(Math.round(dailySpend))}/день** баланс может уйти в ноль примерно **${runOutDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}** (через ${daysLeft} дней).\n\nСовет: сократите расходы или пополните счёт.` };
  }

  // Подписки
  if (lower.includes('подписк') || lower.includes('регулярн') || lower.includes('повторяющ')) {
    const subs = context.operations
      .filter(o => o.type === 'expense')
      .reduce((acc: Record<string, number>, o: any) => {
        const key = o.comment || o.categoryId || '';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    const recurring = Object.entries(subs).filter(([, count]) => count >= 2).slice(0, 3);
    if (recurring.length === 0) return { reply: 'Повторяющихся платежей не обнаружено. Добавьте больше операций для анализа.' };
    return { reply: `Найдены возможные регулярные платежи:\n${recurring.map(([name]) => `• ${name}`).join('\n')}\n\nПроверьте их в разделе «Операции».` };
  }

  // Цели
  if (lower.includes('цел') || lower.includes('накоп')) {
    if (context.goals.length === 0) return { reply: 'У вас пока нет финансовых целей. Создайте первую в разделе «План»!' };
    const goal = context.goals[0];
    const remaining = goal.targetAmount - goal.currentAmount;
    const savingsRate = context.monthIncome > 0 ? (context.monthIncome - context.monthExpense) / context.monthIncome : 0;
    const monthlySavings = context.monthIncome * savingsRate;
    const monthsNeeded = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
    return {
      reply: `Ваша цель «${goal.title}»:\n• Накоплено: ${formatMoney(goal.currentAmount)} из ${formatMoney(goal.targetAmount)}\n• Осталось: ${formatMoney(remaining)}${monthsNeeded ? `\n• При текущей норме сбережений (${formatMoney(Math.round(monthlySavings))}/мес) достигнете через ~${monthsNeeded} мес.` : ''}`,
    };
  }

  // Советы по экономии
  if (lower.includes('сэконом') || lower.includes('совет') || lower.includes('как накоп')) {
    return {
      reply: `💡 **Советы для увеличения накоплений:**\n\n1. Правило 50/30/20 — 50% на обязательное, 30% на желаемое, 20% на сбережения\n2. Платите сначала себе — откладывайте в день зарплаты\n3. Отслеживайте подписки — россияне в среднем тратят 3-5 тыс. на неиспользуемые сервисы\n4. Ведите учёт ежедневно — это повышает осознанность трат на 30%`,
    };
  }

  // Дефолтный ответ
  const tips = [
    'Попробуйте написать: «потратил 500 рублей на кофе»',
    'Спросите: «сколько у меня денег?»',
    'Спросите: «когда кончатся деньги?»',
    'Спросите: «что с моими целями?»',
    'Спросите: «как сэкономить?»',
  ];
  return { reply: `Я ваш финансовый ИИ-ассистент 🤖\n\nЯ пока не понял запрос. Попробуйте:\n${tips.map(t => `• ${t}`).join('\n')}` };
}

export function AiAssistantScreen() {
  const { accounts, operations, goals, budget, addOperation, categories } = useFinanceStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Привет! Я ваш финансовый ИИ-ассистент 🤖\n\nМогу:\n• Записать расход голосом/текстом\n• Показать прогноз баланса\n• Найти регулярные платежи\n• Дать совет по накоплениям\n\nЧто хотите узнать?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { start, end } = getMonthRange();
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end));
  const context = {
    totalBalance: getTotalBalance(accounts),
    monthExpense: sumByType(monthOps, 'expense'),
    monthIncome: sumByType(monthOps, 'income'),
    goals,
    operations,
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Имитируем задержку ИИ
    await new Promise(r => setTimeout(r, 700));

    const { reply, parsed } = parseIntent(text, context);

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: reply,
      action: parsed?.amount
        ? {
            label: `Добавить расход ${formatMoney(parsed.amount)}`,
            onPress: async () => {
              const cat = categories.find(c => c.name === parsed.category && c.type === 'expense');
              await addOperation({
                type: 'expense',
                amount: parsed.amount!,
                currency: 'RUB',
                date: new Date().toISOString(),
                accountId: accounts[0]?.id || '',
                categoryId: cat?.id,
                comment: parsed.comment,
              });
              const confirmMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                text: `✅ Расход ${formatMoney(parsed.amount!)} добавлен!`,
              };
              setMessages(prev => [...prev, confirmMsg]);
            },
          }
        : undefined,
    };

    setMessages(prev => [...prev, assistantMsg]);
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const QUICK = ['Сколько денег?', 'Прогноз баланса', 'Мои цели', 'Как сэкономить?'];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            loading ? (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={styles.assistantText}>...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={item.role === 'user' ? styles.userRow : styles.assistantRow}>
              {item.role === 'assistant' && (
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
                    {item.text}
                  </Text>
                </View>
                {item.action && (
                  <Pressable style={styles.actionBtn} onPress={item.action.onPress}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={16} color={colors.white} />
                    <Text style={styles.actionBtnText}>{item.action.label}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        />

        <View style={styles.quickRow}>
          {QUICK.map(q => (
            <Pressable key={q} style={styles.quickChip} onPress={() => { setInput(q); }}>
              <Text style={styles.quickChipText}>{q}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Напишите запрос..."
            placeholderTextColor={colors.textSecondary}
            multiline
            onSubmitEditing={send}
          />
          <Pressable style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]} onPress={send} disabled={!input.trim()}>
            <MaterialCommunityIcons name="send" size={22} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.lg },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md, gap: spacing.sm },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  bubble: { borderRadius: radius.lg, padding: spacing.md, maxWidth: '85%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  userText: { ...typography.body, color: colors.white },
  assistantText: { ...typography.body, color: colors.text },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginTop: spacing.xs, alignSelf: 'flex-start',
  },
  actionBtnText: { ...typography.bodyBold, color: colors.white, fontSize: 13 },
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  quickChip: {
    backgroundColor: colors.card, borderRadius: radius.round,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  quickChipText: { ...typography.small, color: colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.body, color: colors.text,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
