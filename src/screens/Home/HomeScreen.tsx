import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, LoadingState } from '../../components/common';
import { ProgressBar } from '../../components/common/ProgressBar';
import { QuickActions } from '../../components/home/QuickActions';
import { FinHealthCard } from '../../components/home/FinHealthCard';
import { HomeStackParamList, RootStackParamList } from '../../navigation/types';
import { useFinanceStore } from '../../store/financeStore';
import { colors, spacing, typography } from '../../theme';
import { calcFinHealth, getMonthRange, getTotalBalance, isInPeriod, sumByType } from '../../utils/calc';
import { formatDate, formatMoney, formatSignedMoney } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import { Budget, FinancialEvent, Goal } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList & HomeStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { accounts, operations, budget, goals, events, recommendations, isLoading, error, loaded, loadAll } = useFinanceStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded]);

  if (isLoading && !loaded) {
    return <LoadingState label="Загружаем ваши финансы..." />;
  }

  const totalBalance = getTotalBalance(accounts);
  const { start, end } = getMonthRange();
  const periodOps = operations.filter((o) => isInPeriod(o.date, start, end));
  const income = sumByType(periodOps, 'income');
  const expense = sumByType(periodOps, 'expense');
  const capital = totalBalance;
  const finHealth = calcFinHealth(accounts, operations, budget);

  // Прогноз кассового разрыва
  const dayOfMonth = new Date().getDate();
  const dailySpend = dayOfMonth > 0 && expense > 0 ? expense / dayOfMonth : 0;
  const daysUntilEmpty = dailySpend > 0 ? Math.floor(totalBalance / dailySpend) : null;
  const cashflowWarning = daysUntilEmpty !== null && daysUntilEmpty < 30;

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(0, 3);

  const expensePercent = budget && budget.plannedExpense > 0 ? (budget.actualExpense / budget.plannedExpense) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.scroll} >
        <ScrollContent
          navigation={navigation}
          totalBalance={totalBalance}
          income={income}
          expense={expense}
          capital={capital}
          budget={budget}
          expensePercent={expensePercent}
          upcomingEvents={upcomingEvents}
          goals={goals}
          recommendations={recommendations}
          daysUntilEmpty={daysUntilEmpty}
          cashflowWarning={cashflowWarning}
          userName={user?.name}
          isLoading={isLoading}
          loadAll={loadAll}
          finHealth={finHealth}
        />
      </View>
    </View>
  );
}

function ScrollContent({
  navigation,
  totalBalance,
  income,
  expense,
  capital,
  budget,
  expensePercent,
  upcomingEvents,
  goals,
  recommendations,
  daysUntilEmpty,
  cashflowWarning,
  userName,
  isLoading,
  loadAll,
  finHealth,
}: {
  navigation: Nav;
  totalBalance: number;
  income: number;
  expense: number;
  capital: number;
  budget: Budget | null;
  expensePercent: number;
  upcomingEvents: FinancialEvent[];
  goals: Goal[];
  recommendations: import('../../types').Recommendation[];
  daysUntilEmpty: number | null;
  cashflowWarning: boolean;
  userName?: string;
  isLoading: boolean;
  loadAll: () => Promise<void>;
  finHealth: import('../../utils/calc').FinHealthIndicators;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAll} colors={[colors.primary]} />}
    >
      <Text style={styles.greeting}>Привет, {userName?.split(' ')[0] || 'друг'} 👋</Text>

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Общий баланс</Text>
        <Text style={styles.balanceValue}>{formatMoney(totalBalance)}</Text>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <View style={styles.rowHeader}>
              <MaterialCommunityIcons name="arrow-down-circle" size={16} color={colors.income} />
              <Text style={styles.rowLabel}>Доходы за месяц</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.income }]}>{formatSignedMoney(income)}</Text>
          </View>
          <View style={styles.rowItem}>
            <View style={styles.rowHeader}>
              <MaterialCommunityIcons name="arrow-up-circle" size={16} color={colors.expense} />
              <Text style={styles.rowLabel}>Расходы за месяц</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.expense }]}>{formatSignedMoney(-expense)}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Капитал</Text>
          <Text style={styles.rowValueBold}>{formatMoney(capital)}</Text>
        </View>
      </Card>

      {cashflowWarning && daysUntilEmpty !== null && (
        <Pressable style={styles.cashflowAlert} onPress={() => navigation.navigate('MoreTab' as never)}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.cashflowAlertTitle}>⚠️ Кассовый разрыв через {daysUntilEmpty} дней</Text>
            <Text style={styles.cashflowAlertText}>При текущем темпе трат баланс уйдёт в ноль. Спросите ИИ-ассистента как исправить.</Text>
          </View>
        </Pressable>
      )}

      {recommendations.length > 0 && (
        <Card style={styles.adviceCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Советы</Text>
            <Pressable onPress={() => navigation.navigate('MoreTab' as never)}>
              <Text style={styles.link}>Все советы</Text>
            </Pressable>
          </View>
          {recommendations.slice(0, 2).map((rec) => {
            const color = rec.severity === 'high' ? colors.expense : rec.severity === 'medium' ? colors.warning : colors.income;
            const icon = rec.severity === 'high' ? 'alert-circle' : rec.severity === 'medium' ? 'alert-outline' : 'lightbulb-on-outline';
            return (
              <View key={rec.id} style={styles.recRow}>
                <MaterialCommunityIcons name={icon as any} size={20} color={color} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDesc} numberOfLines={2}>{rec.description}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      <QuickActions
        actions={[
          { key: 'expense', label: 'Расход', icon: 'minus-circle', color: colors.expense, onPress: () => navigation.navigate('AddOperation', { type: 'expense' }) },
          { key: 'income', label: 'Доход', icon: 'plus-circle', color: colors.income, onPress: () => navigation.navigate('AddOperation', { type: 'income' }) },
          { key: 'transfer', label: 'Перевод', icon: 'swap-horizontal-circle', color: colors.transfer, onPress: () => navigation.navigate('AddOperation', { type: 'transfer' }) },
          { key: 'goal', label: 'Цель', icon: 'flag-checkered', color: '#7C3AED', onPress: () => navigation.navigate('PlanTab' as never) },
          { key: 'event', label: 'Событие', icon: 'calendar-plus', color: '#0EA5E9', onPress: () => navigation.navigate('CalendarTab' as never) },
        ]}
      />

      <FinHealthCard indicators={finHealth} />

      {budget ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Бюджет на месяц</Text>
            <Pressable onPress={() => navigation.navigate('PlanTab' as never)}>
              <Text style={styles.link}>Подробнее</Text>
            </Pressable>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetText}>
              Потрачено {formatMoney(budget.actualExpense)} из {formatMoney(budget.plannedExpense)}
            </Text>
            <Text style={[styles.budgetPercent, expensePercent >= 100 && { color: colors.danger }]}>
              {Math.round(expensePercent)}%
            </Text>
          </View>
          <ProgressBar percent={expensePercent} />
          {expensePercent >= 100 ? (
            <Text style={styles.warningText}>Вы превысили план расходов на месяц</Text>
          ) : expensePercent >= 80 ? (
            <Text style={styles.warningText}>Вы близки к лимиту бюджета</Text>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ближайшие платежи</Text>
          <Pressable onPress={() => navigation.navigate('CalendarTab' as never)}>
            <Text style={styles.link}>Календарь</Text>
          </Pressable>
        </View>
        {upcomingEvents.length === 0 ? (
          <Text style={styles.emptyText}>Нет запланированных платежей</Text>
        ) : (
          upcomingEvents.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <View style={styles.eventIcon}>
                <MaterialCommunityIcons
                  name={event.type === 'income' ? 'arrow-down' : event.type === 'expense' ? 'arrow-up' : 'bell-outline'}
                  size={18}
                  color={event.type === 'income' ? colors.income : event.type === 'expense' ? colors.expense : colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              </View>
              {event.amount ? (
                <Text style={[styles.eventAmount, { color: event.type === 'income' ? colors.income : colors.text }]}>
                  {event.type === 'income' ? '+' : '-'}{formatMoney(event.amount)}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Финансовые цели</Text>
          <Pressable onPress={() => navigation.navigate('PlanTab' as never)}>
            <Text style={styles.link}>Все цели</Text>
          </Pressable>
        </View>
        {goals.length === 0 ? (
          <EmptyState icon="flag-outline" title="Пока нет целей" subtitle="Создайте первую финансовую цель" />
        ) : (
          goals.slice(0, 2).map((goal) => {
            const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            return (
              <Pressable
                key={goal.id}
                style={styles.goalRow}
                onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              >
                <View style={[styles.goalIcon, { backgroundColor: goal.color + '22' }]}>
                  <MaterialCommunityIcons name={goal.icon as any} size={20} color={goal.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <ProgressBar percent={percent} color={goal.color} height={6} />
                  <Text style={styles.goalAmounts}>
                    {formatMoney(goal.currentAmount)} из {formatMoney(goal.targetAmount)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  balanceCard: {
    backgroundColor: colors.primary,
  },
  balanceLabel: {
    ...typography.body,
    color: '#E8F5E9',
  },
  balanceValue: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowItem: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rowLabel: {
    ...typography.caption,
    color: '#E8F5E9',
  },
  rowValue: {
    ...typography.h3,
    color: colors.white,
  },
  rowValueBold: {
    ...typography.h3,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  budgetText: {
    ...typography.body,
    color: colors.text,
  },
  budgetPercent: {
    ...typography.bodyBold,
    color: colors.text,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
  },
  eventDate: {
    ...typography.small,
    color: colors.textSecondary,
  },
  eventAmount: {
    ...typography.bodyBold,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  goalAmounts: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 4,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  recDesc: {
    ...typography.small,
    color: colors.textSecondary,
  },
  cashflowAlert: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.expense,
    borderRadius: 12, padding: spacing.md,
    marginTop: spacing.lg,
  },
  cashflowAlertTitle: { ...typography.bodyBold, color: '#fff' },
  cashflowAlertText: { ...typography.small, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  adviceCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
